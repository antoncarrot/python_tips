### Data migration

```python
def copy_data(apps, schema_editor):
    Data = apps.get_model("django_app", "Data")
    DataNew = apps.get_model("django_app", "DataNew")

    # copy data

def revert_copy_data(apps, schema_editor):
    # restore data
```

```python
    operations = [
        ...,
        migrations.RunPython(copy_data, revert_copy_data),
    ]
```

### Form filed initial

```python
def __init__(self, *args, **kwargs):
    super(Form, self).__init__(*args, **kwargs)
    self.initial["field"] = ""
```

### JSONField

```python
from django.contrib.postgres.fields import JSONField

json_filed = JSONField(null=True, default=None, encoder=DjangoJSONEncoder)
```

JSON example

```python
{"key1": {"key2": "value"}}
```

query

```python
queryset = Model.objects.filter(json_filed__isnull=False, json_filed__key1__isnull=False)
```

FilterSet

```python
from django_filters import filterset

class JsonFilterSet(filterset.FilterSet):
    json_field = filters.CharFilter(field_name="model_field", lookup_expr="key1__key2")
```

access json

```python
instance.json_field["key1"]["key2"]
```

### Register signals

import signals in app config class

```python
def ready(self):
    import app.signals  # init signals
```


### Model method as property

```python
@property
def model_field(self):
    return self.field.replace("-", "_")

model_field.short_description = "model_field description"
```
