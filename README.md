# Python tips

## [Django tips](Django.md)

## [Celery tips](Celery.md)

### Old python via pyenv

build openssl 1.0

```bash
mkdir $HOME/openssl-1.0.2t_pyenv
./config --prefix=$HOME/openssl-1.0.2t_pyenv/ shared -fPIC
make
make install
```

install python

```bash
CFLAGS="-I$HOME/openssl-1.0.2t_pyenv/include" \
LDFLAGS="-L$HOME/openssl-1.0.2t_pyenv/lib -Wl,-rpath=$HOME/openssl-1.0.2t_pyenv/lib" \
pyenv install -v 3.4.2
```

### Python docstring types

```python
def function(text, num):
    """
    :param basestring text: text description
    :param int num: num description
    :rtype: str
    :raises OSError: description
    """
    raise OSError
    return ""
```

### Reraise exception

```python
try:
    raise Exception
except Exception:
    # do something and reraise
    raise
```

### CSV file

```python
import csv

from codecs import BOM_UTF8
from io import StringIO


with StringIO("w") as mem_file:
    mem_file.write(BOM_UTF8.decode("utf-8", "strict"))  # utf8 BOM for windows excel
    writer = csv.DictWriter(mem_file, fieldnames=["col_1", "col_2"], delimiter=config.CSV_DELIMITER)
    writer.writeheader()
    for row in data:
        writer.writerow(row)
```

### Remove nested exceptions trace

```python
except ConnectionError as e:
    e.__cause__ = None  # hide "During handling of the above exception, another exception occurred"
    logger.exception(e)
```
