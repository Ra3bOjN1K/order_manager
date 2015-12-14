# -*- coding: utf-8 -*-

from app.celery import app


@app.task
def add(x, y):
    return x + y


@app.task
def send_order_to_users(order_data):
    pass
