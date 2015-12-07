# -*- coding: utf-8 -*-

from django.db.utils import IntegrityError


class CommonDataGenerator:
    first_names = (
        'Александр', 'Михаил', 'Сергей', 'Юрий', 'Евгений', 'Степан', 'Егор',
        'Константин', 'Николай', 'Владимир', 'Влад', 'Артем', 'Дмитрий', 'Петр',
        'Василий', 'Олег', 'Семен', 'Антон'
    )

    last_names = (
        'Попов', 'Грачев', 'Сюткин', 'Морозов', 'Коваль', 'Овечко', 'Синица',
        'Готовкин', 'Висловух', 'Руденок', 'Кокарев', 'Петроченко', 'Форточкин',
        'Открывашка', 'Шидловский', 'Утюгов', 'Кортавко', 'Яблонский',
        'Лысковец', 'Барташевич', 'Врублевский', 'Жулев', 'Карнацевич',
        'Мармеладов', 'Торопунько'
    )

    city = ('Минск', 'Витебск', 'Гомель', 'Гродно', 'Могилев', 'Брест',
            'Орша', 'Полоцк', 'Поставы', 'Глубокое', 'Браслав', 'Пинск')

    street = ('Молодежная', 'Пушкина', 'Московская', 'Богдановича',
              'Некрасова', 'К.Цеткин', 'Р.Люксембург')

    def generate_first_name(self):
        from random import choice
        return choice(self.first_names)

    def generate_last_name(self):
        from random import choice
        return choice(self.last_names)

    def generate_full_name(self):
        return '{0} {1}'.format(self.generate_last_name(),
                                self.generate_first_name())

    def generate_phone(self):
        from random import randint, choice
        country_code = '+375'
        provider_code = ('29', '33', '44')

        def gen_str_with_num():
            return str(randint(0, 99)).ljust(2, '0')

        return '{}({}){}-{}-{}'.format(
            country_code, choice(provider_code), randint(100, 999),
            gen_str_with_num(), gen_str_with_num())

    def generate_address(self):
        from random import randint, choice
        return {
            'city': choice(self.city),
            'street': choice(self.street),
            'house': randint(1, 130),
            'apartment': randint(1, 130)
        }

    def generate_birthday(self, min_age, max_age):
        from datetime import date
        from random import randint

        td = date.today()
        start_date = td.replace(
            year=(td.year - randint(min_age, max_age))).toordinal()
        end_date = td.replace(year=td.year - min_age).toordinal()
        random_day = date.fromordinal(randint(start_date, end_date))

        return random_day.strftime('%Y-%m-%d')

    def generate_date_in_future(self, num_days_for_start=2,
                                num_days_for_end=10):
        from datetime import date, timedelta
        from random import randint

        future_date = date.today() + timedelta(
            days=randint(num_days_for_start, num_days_for_end))

        return future_date.strftime('%Y-%m-%d')

    def generate_time(self, time_from=8, time_to=15):
        from random import randint

        hours = randint(time_from, time_to)
        mins = (randint(0, 59) // 10) * 10

        return '{0}:{1}'.format(hours, mins)


class UserProfileGenerator:
    MANAGER, ANIMATOR, PHOTOGRAPHER = ('manager', 'animator', 'photographer')

    def _generate_user_weekends_str(self):
        import random

        days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
        weekends = []

        while len(days) > 1:
            f_day = days.pop(0)
            for day in days:
                weekends.append([f_day, day])

        return random.choice(weekends)

    def generate(self, role, num=1):
        from mixer.main import mixer
        from orders_manager.models import UserProfile

        class Scheme:
            username = str
            email = str
            address = str

        common_gen = CommonDataGenerator()

        profiles = []

        while len(profiles) < num:
            data = mixer.blend(Scheme)

            user_info = {
                'username': data.username,
                'first_name': common_gen.generate_first_name(),
                'last_name': common_gen.generate_last_name(),
                'email': data.email,
                'phone': common_gen.generate_phone(),
                'password': '12345',
                'address': data.address,
            }

            try:
                if role == self.MANAGER:
                    profiles.append(
                        UserProfile.objects.create_manager(**user_info))
                elif role == self.ANIMATOR:
                    profiles.append(
                        UserProfile.objects.create_animator(**user_info))
                elif role == self.PHOTOGRAPHER:
                    profiles.append(
                        UserProfile.objects.create_photographer(**user_info))
            except IntegrityError:
                pass

        return profiles


class PossibleExecutorsMixin:
    def __init__(self):
        from orders_manager.models import UserProfile
        self.executors = UserProfile.objects.all_executors()

    def _get_num_executors(self):
        from random import randint
        len_ex = len(self.executors)

        if not len_ex:
            raise AttributeError('Create executors before!')

        return randint(1, len_ex if len_ex < 3 else 3)

    def _get_possible_executors(self, min_num):
        from random import randint, choice
        ex = set()
        num_ex = randint(min_num, len(self.executors))
        while len(ex) < num_ex:
            ex.add(choice(self.executors))
        return list(ex)


class ProgramGenerator(PossibleExecutorsMixin):
    characters = (
        'Кот в сапогах', 'Клоун', 'Дед Мороз', 'Снегурка', 'Собака', 'Гном',
        'Колобок', 'Иван-Дурак', 'Баба-Яга', 'Кащей', 'Буратино', 'Волк',
        'Поросенок', 'Чебурашка'
    )

    def _get_characters(self, num_characters):
        from random import choice
        items = set()
        while len(items) < num_characters:
            items.add(choice(self.characters))
        return list(items)

    def _get_title(self, characters):
        if len(characters) == 1:
            return characters[0]
        return '{0} и {1}'.format(', '.join(characters[:-1]), characters[-1])

    def generate(self, num=1):
        from orders_manager.models import Program
        programs = {}

        while len(programs) < num:
            num_executors = self._get_num_executors()
            characters = self._get_characters(num_executors)
            title = self._get_title(characters)
            possible_executors = self._get_possible_executors(
                num_executors)

            data_info = {
                'title': title,
                'characters': ', '.join(characters),
                'num_executors': num_executors,
                'possible_executors': possible_executors
            }
            programs.update({tuple(characters): data_info})

        res = []

        price_gen = ProgramPriceGenerator()

        for _, data in programs.items():
            program = Program.objects.create(**data)
            price_gen.generate(program)
            res.append(program)

        return res


class ProgramPriceGenerator:
    def generate(self, program):
        from random import randint
        from orders_manager.models import ProgramPrice

        k = randint(1000, 1700) / 1.0

        for i in range(randint(3, 6), randint(7, 20), 3):
            duration = i * 10
            price = int(duration * 12.5 * k / 100) * 100
            ProgramPrice.objects.create(**{
                'program_id': program.id,
                'duration': duration,
                'price': price
            })


class AdditionalServicesGenerator(PossibleExecutorsMixin):
    services_names = 'Гелевые шары', 'Сахарная вата', 'Надувные персонажи'

    def _generate_service_price(self):
        from random import randint
        return (randint(300000, 1000000) // 100) * 100

    def generate(self, num=3):
        from random import choice
        from orders_manager.models import AdditionalService
        services = {}

        while len(services) < num:
            service_name = choice(self.services_names)
            num_executors = self._get_num_executors()
            possible_executors = self._get_possible_executors(num_executors)

            data_info = {
                'title': service_name,
                'num_executors': num_executors,
                'possible_executors': possible_executors,
                'price': self._generate_service_price()
            }
            services.update({service_name: data_info})

        return [AdditionalService.objects.create(**data) for k, data in
                services.items()]


class DiscountsGenerator:
    def generate(self):
        from orders_manager.models import Discount
        discounts = []
        for name, val in (('Скидка №1', 5),
                          ('Скидка №2', 10),
                          ('Скидка №3', 50)):
            discounts.append(Discount.objects.create(name=name, value=val))
        return discounts


class ClientChildGenerator:
    child_names = (
        'Миша', 'Таня', 'Катя', 'Толя', 'Юра', 'Саша', 'Рита',
        'Ваня', 'Руслан', 'Костя', 'Егор', 'Армен', 'Света', 'Оля', 'Кирилл',
        'Сергей', 'Женя', 'Артем', 'Юра', 'Вова', 'Иван', 'Слава', 'Кеша',
        'Люба', 'Лена', 'Ира', 'Кенни', 'Эрик', 'Стэн', 'Баттерс', 'Кайл',
        'Вэнди', 'Вася'
    )

    def generate(self, client, num=1):
        from random import choice, randint
        from orders_manager.models import ClientChild

        names = set()
        while len(names) < num:
            names.add(choice(self.child_names))

        common_gen = CommonDataGenerator()

        children = []

        for name in names:
            data = {
                'name': name,
                'age': randint(2, 10),
                'celebrate_date': common_gen.generate_date_in_future(
                    num_days_for_start=10, num_days_for_end=90),
                'client_id': client.id
                # 'birthday': common_gen.generate_birthday(3, 9)
            }
            children.append(ClientChild.objects.update_or_create(**data))

        return children


class ClientGenerator:
    def generate(self, num=1):
        from random import randint
        from mixer.main import mixer
        from orders_manager.models import Client

        class Scheme:
            username = str
            email = str
            comments = str

        common_gen = CommonDataGenerator()

        clients = []

        while len(clients) < num:

            data = mixer.blend(
                Scheme,
                username=mixer.FAKE,
                email=mixer.FAKE,
                comments=mixer.FAKE
            )

            info = {
                'name': common_gen.generate_full_name(),
                'phone': common_gen.generate_phone(),
                'phone_2': common_gen.generate_phone(),
                'email': data.email,
                'vk_link': 'http://vk.com/' + data.username,
                'odnoklassniki_link': 'http://odnoklassniki.ru/' + data.username,
                'instagram_link': 'http://instagram.com/' + data.username,
                'facebook_link': 'http://facebook.com/' + data.username,
                'secondby_link': 'http://secondby.in/' + data.username,
                'comments': data.comments
            }

            client = Client.objects.update_or_create(**info)
            ClientChildGenerator().generate(client, randint(1, 4))
            # client.children = [x.id for x in children]
            clients.append(client)

        return clients


class DaysOffGenerator:
    def generate(self, num_days_off=10, days_spread_future=15):
        from random import choice
        from orders_manager.models import UserProfile, DayOff

        all_executors = UserProfile.objects.all_executors()

        common_gen = CommonDataGenerator()

        days_off_list = []

        def _gen_start_and_end_times():
            t = [
                common_gen.generate_time(time_to=17),
                common_gen.generate_time(time_to=17)
            ]
            t.sort()
            return t

        while len(days_off_list) < num_days_off:
            date = common_gen.generate_date_in_future(
                        num_days_for_start=-3, num_days_for_end=days_spread_future)
            executor_id = choice(all_executors).user_id
            day_off_times = _gen_start_and_end_times()
            days_off_list.append(DayOff.objects.create(**{
                'user_id': executor_id,
                'date': date,
                'time_start': day_off_times[0],
                'time_end': day_off_times[1]
            }))



class OrderGenerator:
    def _get_author_id(self):
        from orders_manager.models import UserProfile
        from random import choice

        managers = UserProfile.objects.all_managers()
        if managers:
            return choice(managers).user.id
        else:
            raise IndexError('Managers was not created!')

    def _get_client_id(self):
        from orders_manager.models import Client
        from random import choice

        client = Client.objects.all()
        if client:
            return choice(client).id
        else:
            raise IndexError('Clients was not created!')

    def _get_client_children_ids(self, client_id):
        from orders_manager.models import ClientChild
        from random import choice, randint

        ch_list = set()
        children = ClientChild.objects.filter(client_id=client_id).all()

        if children:
            rand_lim = randint(1, 2)
            ch_limit = rand_lim if rand_lim < len(children) else len(children)

            while len(ch_list) < ch_limit:
                ch_list.add(choice(children).id)
        else:
            raise IndexError('ClientChildren was not created!')

        return list(ch_list)

    def _get_celebrate_place(self):
        from random import choice

        places = ('Квартира', 'Кафе', 'Детский сад', 'Детский центр', 'Другое')
        return choice(places)

    def _get_program_id(self):
        from orders_manager.models import Program
        from random import choice

        program = Program.objects.all()
        if program:
            return choice(program).id
        else:
            raise IndexError('Program was not created!')

    def _get_program_executors_ids(self, program_id):
        from orders_manager.models import Program
        from random import choice

        executors_list = set()
        program = Program.objects.get(id=program_id)

        if program.possible_executors:

            while len(executors_list) < program.num_executors:
                executors_list.add(
                    choice(program.possible_executors.all()).user.id
                )
        else:
            raise IndexError('Program has not possible executors!')

        return list(executors_list)

    def _get_services_executors_ids(self, services_ids):
        from orders_manager.models import AdditionalService
        from random import choice

        executors_ids_list = set()

        num_exec_required = 0

        for serv_id in services_ids:
            num_exec_required += AdditionalService.objects.get(
                id=serv_id).num_executors

        possible_executors = AdditionalService.objects.all_possible_executors(
            services_ids)

        if possible_executors:
            while len(executors_ids_list) < num_exec_required:
                executors_ids_list.add(choice(possible_executors).user.id)
        else:
            raise IndexError('Additional services has not possible executors!')

        return list(executors_ids_list)

    def _get_program_duration(self, program_id):
        from orders_manager.models import ProgramPrice
        from random import choice

        program_prices = ProgramPrice.objects.filter(program_id=program_id)
        if program_prices:
            return choice(program_prices).duration
        else:
            raise IndexError('ProgramPrices was not created!')

    def _get_program_price(self, program_id, duration):
        from orders_manager.models import ProgramPrice

        program_price = ProgramPrice.objects.filter(program_id=program_id,
                                                    duration=duration)
        if program_price:
            return program_price.first().price
        else:
            raise IndexError('ProgramPrices was not created!')

    def _get_additional_serveces_ids(self):
        from orders_manager.models import AdditionalService
        from random import choice, randint

        serv_list = set()
        services = AdditionalService.objects.all()

        if services:
            rand_lim = randint(1, 2)
            serv_limit = rand_lim if rand_lim < len(services) else len(services)

            while len(serv_list) < serv_limit:
                serv_list.add(choice(services).id)
        else:
            raise IndexError('AdditionalServices was not created!')

        return list(serv_list)

    def _get_discount(self):
        from orders_manager.models import Discount
        from random import choice

        discounts = Discount.objects.all()
        if discounts:
            return choice(discounts).id
        else:
            raise IndexError('Discounts was not created!')

    def _get_children_num(self):
        from random import randint
        rand_num = randint(3, 20)
        return rand_num

    def _get_where_was_found(self):
        from random import choice

        return choice(
            ('Не задано', 'Google', 'Yandex', 'Mail.ru', 'Second', 'VK',
             'Посоветовали', 'Повторный', 'Листовка', 'Рассылка', 'Другое')
        )

    def _get_cost_of_the_way(self):
        from random import randint
        return int(randint(50000, 300000) / 100) * 100

    def generate(self, num_events=60, num_days=45):
        from orders_manager.models import Order
        from mixer.main import mixer
        import json

        class Scheme:
            address_details = str
            details = str
            executor_comment = str

        orders_list = []

        while len(orders_list) < num_events:

            data = mixer.blend(Scheme)

            common_gen = CommonDataGenerator()

            client_id = self._get_client_id()
            program_id = self._get_program_id()
            program_duration = self._get_program_duration(program_id)
            program_price = self._get_program_price(program_id,
                                                    program_duration)
            additional_services_ids = self._get_additional_serveces_ids()

            address = common_gen.generate_address()
            address.update({
                'details': data.address_details
            })

            order_info = {
                'author_id': self._get_author_id(),
                'client_id': client_id,
                'client_children_id': self._get_client_children_ids(client_id),
                'children_num': self._get_children_num(),
                'celebrate_date': common_gen.generate_date_in_future(
                    num_days_for_start=-7, num_days_for_end=num_days),
                'celebrate_time': common_gen.generate_time(),
                'celebrate_place': self._get_celebrate_place(),
                'address': json.dumps(address),
                'program_id': program_id,
                'program_executors_id': self._get_program_executors_ids(
                    program_id),
                'duration': program_duration,
                'additional_services_id': additional_services_ids,
                'services_executors_id': self._get_services_executors_ids(
                    additional_services_ids),
                'discount_id': self._get_discount(),
                'details': data.details,
                'executor_comment': data.executor_comment,
                'where_was_found': self._get_where_was_found(),
                'cost_of_the_way': self._get_cost_of_the_way(),
                'price': program_price,
                'total_price': program_price,
                'total_price_with_discounts': program_price
            }
            orders_list.append(Order.objects.create(**order_info))

        return orders_list


def populate_database():
    UserProfileGenerator().generate(UserProfileGenerator.MANAGER, num=5)
    UserProfileGenerator().generate(UserProfileGenerator.ANIMATOR, num=7)
    UserProfileGenerator().generate(UserProfileGenerator.PHOTOGRAPHER, num=3)
    ProgramGenerator().generate(20)
    AdditionalServicesGenerator().generate()
    DiscountsGenerator().generate()
    ClientGenerator().generate(16)
    DaysOffGenerator().generate(28, 25)
    OrderGenerator().generate(num_events=60, num_days=45)
