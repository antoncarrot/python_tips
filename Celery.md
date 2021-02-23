### Chain with lock

python 2

use locked_chain instead celery chain

_lock, _unlock - tasks that acquire and release lock

```python
from inspect import getcallargs

from celery.canvas import _chain, chain

class locked_chain(_chain):
    def __init__(self, *tasks, **options):
        from .locked_chain_tasks import _lock, _unlock

        if len(tasks) == 1 and isinstance(tasks[0], _chain):
            # chain in args or task created with | syntax
            tasks = tasks[0].tasks

        func = getattr(tasks[0].type, "_orig_run", tasks[0].type.run)
        signature = getcallargs(func, *tasks[0].args, **tasks[0].kwargs)
        if "arg1" not in signature or "arg2" not in signature:
            raise TypeError("Task {} is not supported".format(tasks[0]))

        self._lock_task = _lock.si(signature["arg1"], signature["arg2"])
        self._unlock_task = _unlock.si(signature["arg1"], signature["arg2"])

        queue = tasks[0].options.get("queue", None)
        if queue:
            self._lock_task.set({"queue": queue})
            self._unlock_task.set({"queue": queue})

        tasks = (self._lock_task,) + tasks
        super(locked_chain, self).__init__(*tasks, **options)

    def _set_lock_tasks(self, options):
        if "link" in options:
            options["link"] = chain(options["link"], self._unlock_task)
        else:
            options["link"] = self._unlock_task

        if "link_error" in options:
            options["link_error"] = chain(options["link_error"], self._unlock_task)
        else:
            options["link_error"] = self._unlock_task

    def apply_async(self, args=None, kwargs=None, **options):
        self._set_lock_tasks(options)
        return super(locked_chain, self).apply_async(args, kwargs, **options)
```

### Dynamic retry options

```python
from celery import Task

class RetriesTask(Task):
    def __init__(self, *args, **kwargs):
        if self.throws:
            self.throws = tuple(self.throws) + (self.MaxRetriesExceededError,)
        else:
            self.throws = (self.MaxRetriesExceededError,)
        super(RetriesTask, self).__init__(*args, **kwargs)

    def retry(self, args=None, kwargs=None, exc=None, throw=True, eta=None, countdown=None, max_retries=None, **options):
        max_retries = config.RETRY_COUNT
        countdown = config.RETRY_COUNTDOWN_SEC
        return super(RetriesTask, self).retry(args, kwargs, exc, throw, eta, countdown, max_retries, **options)
```

how to use

```python
@shared_task(
    base=RetriesTask,
    autoretry_for=(KeyError,),
    retry_kwargs={"max_retries": config.RETRY_COUNT, "countdown": config.RETRY_COUNTDOWN_SEC}
)
```


### Celery beat tasks change from config


```python
import logging

from django.db.utils import ProgrammingError

from django_celery_beat.models import CrontabSchedule, PeriodicTask

logger = logging.getLogger(__name__)


CELERY_BEAT_PERIODIC_TASKS = [
    "app.tasks.periodic.task_name1",
    "app.tasks.periodic.task_name2",
]


def _clean_unregistered_periodic_tasks():
    periodic_tasks = PeriodicTask.objects.all()
    for task in periodic_tasks:
        if task.task not in CELERY_BEAT_PERIODIC_TASKS:
            task.delete()


def _setup_periodic_task(task: str, minute: str, hour: str, day_of_week: str, day_of_month: str, month_of_year: str):
    schedule_data = {
        "minute": minute,
        "hour": hour,
        "day_of_week": day_of_week,
        "day_of_month": day_of_month,
        "month_of_year": month_of_year,
    }
    try:
        task_obj = PeriodicTask.objects.get(name=task, task=task)
        if task_obj.crontab and (
            task_obj.crontab.minute != minute
            or task_obj.crontab.hour != hour
            or task_obj.crontab.day_of_week != day_of_week
            or task_obj.crontab.day_of_month != day_of_month
            or task_obj.crontab.month_of_year != month_of_year
        ):
            CrontabSchedule.objects.filter(pk=task_obj.crontab.pk).update(**schedule_data)
            task_obj.save()  # need for celery beat reconfig
            logger.info(f"Update celery beat task {task} schedule to {schedule_data}")
    except PeriodicTask.DoesNotExist:
        schedule_obj = CrontabSchedule.objects.create(**schedule_data)
        PeriodicTask.objects.create(name=task, task=task, crontab=schedule_obj)
        logger.info(f"Create celery beat task {task} with schedule {schedule_data}")


def setup_periodic_tasks(**kwargs):
    try:
        for task in CELERY_BEAT_PERIODIC_TASKS:
            minute, hour, day_of_week, day_of_month, month_of_year = config.PERIODIC_STATUS_TASKS_SCHEDULE.split()
            _setup_periodic_task(task, minute, hour, day_of_week, day_of_month, month_of_year)

        _clean_unregistered_periodic_tasks()
    except ProgrammingError:
        pass  # skip if this function run before migration apply
    except Exception as e:
        logger.exception(e)
```

### Celery headers

```python
class CustomTask(Task):
    def __call__(self, *args, **kwargs):
        # need to update headers on every task.__call__ iteration
        self.request.headers = {"key": "value"}

        self.request.retries = 0
```
