import pytest
from python_src.config import Config

def test_config_loading():
    config = Config()
    assert config.get_port() == 3001  # default value 