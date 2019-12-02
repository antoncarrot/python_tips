# python tips

### old python via pyenv

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
