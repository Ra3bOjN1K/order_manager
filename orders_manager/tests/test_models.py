from django.test import TestCase
from django.db.models import Q

from rolepermissions.verifications import has_role

from orders_manager.models import UserProfile, Client, ClientChild, \
    AdditionalService, Character, Order, Program, User


class UserRolesTestCase(TestCase):
    fixtures = ['orders_manager/tests/fixtures/fixtures_17092015_1344.yaml']

    #####################################
    # Creating users with roles
    #####################################

    user_info = {
        'username': 'some_user',
        'first_name': 'John',
        'last_name': 'Trivolta',
        'email': 'john@trivolta.com',
        'password': 'some_password',
        'weekends': ['sunday', 'monday'],
        'address': 'Minsk, st.SomeStreet',
    }

    def test_create_animator(self):
        UserProfile.objects.create_animator(**self.user_info)
        animator = UserProfile.objects.filter(
            user__username=self.user_info['username']).first()
        self.assertEqual(self.user_info.get('username'),
                         animator.get_username())
        self.assertEqual(self.user_info.get('first_name'),
                         animator.get_first_name())
        self.assertEqual(self.user_info.get('last_name'),
                         animator.get_last_name())
        self.assertEqual(self.user_info.get('email'), animator.get_email())
        self.assertEqual(self.user_info.get('weekends'),
                         animator.get_weekends())
        self.assertEqual(self.user_info.get('address'), animator.get_address())
        self.assertTrue(has_role(animator.user, 'animator'))

    def test_create_photographer(self):
        UserProfile.objects.create_photographer(**self.user_info)
        manager = UserProfile.objects.filter(
            user__username=self.user_info['username']).first()
        self.assertTrue(has_role(manager.user, 'photographer'))

    def test_create_manager(self):
        UserProfile.objects.create_manager(**self.user_info)
        manager = UserProfile.objects.filter(
            user__username=self.user_info['username']).first()
        self.assertTrue(has_role(manager.user, 'manager'))

    #####################################
    # Search users by roles
    #####################################

    def test_get_all_animators(self):
        animators = UserProfile.objects.all_animators()
        self.assertEqual(3, len([a for a in animators if
                                 a.get_username().endswith('_animator')]))

    def test_get_all_managers(self):
        managers = UserProfile.objects.all_managers()
        self.assertEqual(2, len([m for m in managers if
                                 m.get_username().endswith('_manager')]))

    def test_get_all_photographer(self):
        photographers = UserProfile.objects.all_photographer()
        self.assertEqual(2, len([p for p in photographers if
                                 p.get_username().endswith('_photographer')]))

    #####################################
    # Getting program bonus for user
    #####################################

    def test_get_user_bonus(self):
        user = UserProfile.objects.get(user_id=6)
        bonus = user.get_bonus_for_program(program_id=1)
        self.assertEqual(30, bonus)
        self.assertNotEqual(32, bonus)
        bonus = user.get_bonus_for_program(program_id=2)
        self.assertEqual(46, bonus)
        self.assertNotEqual(30, bonus)
        bonus = user.get_bonus_for_program(program_id=3)
        self.assertEqual(64, bonus)
        self.assertNotEqual(30, bonus)
        bonus = user.get_bonus_for_program(program_id=4)
        self.assertEqual(16, bonus)
        self.assertNotEqual(30, bonus)
        user = UserProfile.objects.get(user_id=2)

        # Manager get 0
        bonus = user.get_bonus_for_program(program_id=1)
        self.assertEqual(0, bonus)
        self.assertNotEqual(32, bonus)


# ==============================================================================

class ClientTestCase(TestCase):
    client_info = {
        'name': 'some_client',
        'phone': '123-235-456',
        'phone_2': '',
        'email': 'john@trivolta.com',
        'vk_link': 'some_password',
        'odnoklassniki_link': 'odnoklassniki_link',
        'instagram_link': 'instagram_link',
        'facebook_link': 'facebook_link',
        'secondby_link': 'secondby_link',
        'comments': 'some comment',
    }

    children_info = {
        'name': 'Сергей',
        'birthday': '2008-03-10'
    }

    def test_create_client(self):
        from django.db.utils import IntegrityError

        client = Client.objects.create(**self.client_info)
        self.assertEqual(self.client_info.get('name'), client.name)
        self.client_info['phone'] = None

        with self.assertRaises(IntegrityError):
            Client.objects.create(**self.client_info)

    def test_add_children_to_client(self):
        client = Client.objects.create(**self.client_info)
        client.children.add(ClientChild.objects.create(**self.children_info))
        self.children_info['name'] = 'Вася'
        self.children_info['birthday'] = '2002-08-16'
        client.children.add(ClientChild.objects.create(**self.children_info))
        self.assertEqual(2, len(client.children.all()))
        self.assertNotEqual(4, len(client.children.all()))

        # def test_children_age(self):
        #     client = Client.objects.create_client(**self.client_info)
        #
        #     child = ClientChild.objects.create_child(**self.children_info)
        #     client.children.add(child)
        #     self.assertEqual(7, client.children.get(name='Сергей').age())
        #
        #     self.children_info['name'] = 'Толя'
        #     self.children_info['birthday'] = '2000-09-16'
        #     child = ClientChild.objects.create_child(**self.children_info)
        #     client.children.add(child)
        #     self.assertEqual(15, client.children.get(name='Толя').age())


# ==============================================================================

class ProgramTestCase(TestCase):
    fixtures = ['orders_manager/tests/fixtures/fixtures_17092015_1344.yaml']

    program_info = {
        'title': 'Маша и медведь',
        'characters_id': [],
        'num_executors': 2,
        'possible_executors_id': [],
        'executors_id': []
    }

    def test_create_program(self):
        characters = Character.objects.filter(
            Q(name='Маша') | Q(name='Медведь')
        ).all()
        characters_id = [ch.id for ch in characters]
        executors = User.objects.filter(
            Q(groups__name='animator') | Q(groups__name='photographer')
        ).all()
        animators_id = [e.id for e in executors]
        self.program_info['characters_id'] = characters_id
        self.program_info['possible_executors_id'] = animators_id[:4]
        self.program_info['executors_id'] = animators_id[:2]
        program = Program.objects.create(**self.program_info)
        self.assertEqual(self.program_info.get('title'), program.title)
        self.assertEqual(2, len(program.characters.all()))
        self.assertNotEqual(1, len(program.characters.all()))
        self.assertEqual(4, len(program.possible_executors.all()))
        self.assertNotEqual(8, len(program.possible_executors.all()))
        self.assertEqual(2, len(program.executors.all()))
        self.assertNotEqual(3, len(program.executors.all()))

    def test_get_correct_programs(self):
        programs = Program.objects.all()
        for p in programs:
            self.assertEqual(p.num_executors, len(p.executors.all()))
            self.assertNotEqual(56, len(p.executors.all()))

    def test_get_all_prices(self):
        program = Program.objects.get(id=1)
        prices = program.get_all_prices()
        self.assertEqual(4, len(prices))
        self.assertEqual([0.2, 0.4, 1, 2], [p.duration for p in prices])

    def test_get_price_by_duration(self):
        program = Program.objects.get(id=1)
        price = program.get_price(duration=1)
        self.assertEqual(600000, price)
        price = program.get_price(duration=12)
        self.assertEqual(0, price)


# ==============================================================================

class AdditionalServicesTestCase(TestCase):
    fixtures = ['orders_manager/tests/fixtures/fixtures_17092015_1344.yaml']

    service_info = {
        'name': 'Some service',
        'price': 300,
        'description': 'some description',
        'executors_id': [6, 7]
    }

    def test_create_service(self):
        service = AdditionalService.objects.create(**self.service_info)
        self.assertEqual(self.service_info.get('name'), service.name)
        self.assertEqual(2, len(service.executors.all()))
        self.assertEqual(300, service.price)
        self.assertEqual(self.service_info.get('description'),
                         service.description)


# ==============================================================================

class OrdersTestCase(TestCase):
    fixtures = ['orders_manager/tests/fixtures/fixtures_17092015_1344.yaml']

    order_info = {
        'code': '',
        'author_id': 2,
        'client_id': 1,
        'client_children_id': [1, 2],
        'celebrate_date': '2015-09-18',
        'celebrate_time': '15:00:00',
        'celebrate_place': 'home',
        'address': 'Minsk, ul.Kalinovskogo',
        'program_id': 1,
        'duration': 1,
        'price': 0,
        'additional_services_id': [1, 2],
        'details': 'some details',
        'executor_comment': 'some comment',
        'discounts_id': [1, 2],
        'total_price': 0,
        'total_price_with_discounts': 0,
        'status': 'soon'
    }

    def test_create_order(self):
        order = Order.objects.create(**self.order_info)
        self.assertEqual(12, len(order.code))
        self.assertEqual(self.order_info.get('author_id'), order.author.id)
        self.assertEqual(self.order_info.get('client_id'), order.client.id)
        self.assertEqual(len(self.order_info.get('client_children_id')),
                         len(order.client_children.all()))
        self.assertEqual(self.order_info.get('celebrate_date'),
                         order.celebrate_date)
        self.assertEqual(self.order_info.get('celebrate_time'),
                         order.celebrate_time)
        self.assertEqual(self.order_info.get('celebrate_place'),
                         order.celebrate_place)
        self.assertEqual(self.order_info.get('address'), order.address)
        self.assertEqual(self.order_info.get('program_id'), order.program.id)
        self.assertEqual(self.order_info.get('duration'), order.duration)
        self.assertEqual(self.order_info.get('price'), order.price)
        self.assertEqual(len(self.order_info.get('additional_services_id')),
                         len(order.additional_services.all()))
        self.assertEqual(self.order_info.get('details'), order.details)
        self.assertEqual(self.order_info.get('executor_comment'),
                         order.executor_comment)
        self.assertEqual(len(self.order_info.get('discounts_id')),
                         len(order.discounts.all()))
        self.assertEqual(self.order_info.get('total_price'), order.total_price)
        self.assertEqual(self.order_info.get('total_price_with_discounts'),
                         order.total_price_with_discounts)
        self.assertEqual(self.order_info.get('status'), order.status)

# ==============================================================================
