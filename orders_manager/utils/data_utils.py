# -*- coding: utf-8 -*-

import random
import string
import datetime


def generate_str(num_chars=3):
    value = ''.join(
        random.choice(
            string.ascii_uppercase + string.ascii_lowercase
        ) for _ in range(num_chars)
    )
    return value


def format_date(date_time=None, pattern='%Y%m%d_%H%M%S'):
    from django.conf import settings
    import pytz

    if date_time and isinstance(date_time, str):
        date_time = datetime.datetime.strptime(
            date_time,
            '%a, %d %b %Y %H:%M:%S %Z'
        )
    date_time = date_time or datetime.datetime.now()
    date_time = pytz.timezone(settings.TIME_ZONE).fromutc(date_time)

    return date_time.strftime(pattern)


def trim_phone_number(phone):
    if phone:
        import re
        return re.sub("\D", "", phone)
    return None


def calculate_age(born, next_age=True):
    today = datetime.date.today()
    try:
        birthday = born.replace(year=today.year)
    except ValueError:
        # raised when birth date is February 29 and the current year is not
        # a leap year
        birthday = born.replace(year=today.year, month=born.month + 1, day=1)
    if birthday > today:
        age = today.year - born.year - 1
    else:
        age = today.year - born.year
    return age + 1 if next_age else age


if __name__ == '__main__':
    pass
