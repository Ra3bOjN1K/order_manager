# -*- coding: utf-8 -*-

from app.celery import app


@app.task(bind=True, default_retry_delay=8)
def add(x, y):
    print(x + y)
