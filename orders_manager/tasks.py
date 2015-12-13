# -*- coding: utf-8 -*-

from app.celery import app


@app.task
def add(x, y):
    return x + y
