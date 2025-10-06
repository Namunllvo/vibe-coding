from setuptools import setup

APP = ['Snapshot.py']
OPTIONS = {
    'argv_emulation': False,
    'packages': ['PIL', 'pynput'],
    'includes': ['jaraco.text'],  # 누락된 모듈 명시
}

setup(
    app=APP,
    options={'py2app': OPTIONS},
    setup_requires=['py2app'],
)
