# -*- coding: utf-8 -*-

from mixer.main import mixer


class UserProfileGenerator:
    MANAGER, ANIMATOR, PHOTOGRAPHER = ('manager', 'animator', 'photographer')

    user_first_names = (
        'Александр', 'Михаил', 'Сергей', 'Юрий', 'Евгений', 'Степан', 'Егор',
        'Константин', 'Николай', 'Владимир', 'Влад', 'Артем', 'Дмитрий', 'Петр',
        'Василий', 'Олег', 'Семен'
    )

    user_last_names = (
        'Попов', 'Грачев', 'Сюткин', 'Морозов', 'Коваль', 'Овечко', 'Синица',
        'Готовкин', 'Висловух', 'Руденок', 'Кокарев', 'Петроченко', 'Форточкин',
        'Открывашка', 'Шидловский', 'Утюгов', 'Кортавко', 'Яблонский',
        'Лысковец', 'Барташевич', 'Врублевский', 'Жулев', 'Карнацевич'
    )

    def _generate_user_weekends_str(self):
        import random
        import json

        days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
        weekends = []

        while len(days) > 1:
            f_day = days.pop(0)
            for day in days:
                weekends.append([f_day, day])

        return json.dumps(random.choice(weekends))

    def generate(self, role, num=1):
        from random import choice
        from orders_manager.models import UserProfile

        class Scheme:
            username = str
            first_name = str
            last_name = str
            email = str
            phone = str
            address = str

        profiles = []

        for _ in range(num):
            data = mixer.blend(
                Scheme,
                first_name=choice(self.user_first_names),
                last_name=choice(self.user_last_names),
                phone=mixer.FAKE
            )

            user_info = {
                'username': data.username,
                'first_name': data.first_name,
                'last_name': data.last_name,
                'email': data.email,
                'phone': data.phone,
                'password': '12345',
                'weekends': self._generate_user_weekends_str(),
                'address': data.address,
            }

            if role == self.MANAGER:
                profiles.append(
                    UserProfile.objects.create_manager(**user_info))
            elif role == self.ANIMATOR:
                profiles.append(
                    UserProfile.objects.create_animator(**user_info))
            elif role == self.PHOTOGRAPHER:
                profiles.append(
                    UserProfile.objects.create_photographer(**user_info))

        return profiles
