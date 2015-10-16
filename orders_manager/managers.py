# -*- coding: utf-8 -*-

from django.db import models, transaction
from django.db.models import Q
from django.contrib.auth.models import User

from orders_manager.roles import Manager as ProjectManager, Animator, \
    Photographer
from orders_manager.utils.data_utils import generate_str, format_date, \
    trim_phone_number


class UserProfileManager(models.Manager):
    def _create_user(self, **kwargs):
        from orders_manager.models import UserProfile

        user = User()
        user.username = kwargs.get('username')
        user.email = kwargs.get('email')
        user.first_name = kwargs.get('first_name')
        user.last_name = kwargs.get('last_name')
        user.set_password(kwargs.get('password'))
        user.save()
        profile = UserProfile()
        profile.user = user
        profile.address = kwargs.get('address')
        profile.phone = kwargs.get('phone')
        profile.save()
        return user

    def create_animator(self, **kwargs):
        user = self._create_user(**kwargs)
        Animator.assign_role_to_user(user)
        return user.profile

    def create_photographer(self, **kwargs):
        user = self._create_user(**kwargs)
        Photographer.assign_role_to_user(user)
        return user.profile

    def create_manager(self, **kwargs):
        user = self._create_user(**kwargs)
        ProjectManager.assign_role_to_user(user)
        return user.profile

    def _all_active(self):
        return super(UserProfileManager, self).filter(user__is_active=True)

    def all_animators(self):
        return self._all_active().filter(
            user__groups__name='animator').order_by('user__last_name').all()

    def all_managers(self):
        return self._all_active().filter(
            user__groups__name='manager').order_by('user__last_name').all()

    def all_photographers(self):
        return self._all_active().filter(
            user__groups__name='photographer').order_by('user__last_name').all()

    def all_executors(self):
        return self._all_active().filter(
            Q(user__groups__name='animator') |
            Q(user__groups__name='photographer')
        ).order_by('user__groups__name').all()


class ClientManager(models.Manager):
    def create(self, **kwargs):
        from orders_manager.models import Client

        client = Client()
        client.name = kwargs.get('name')
        client.phone = trim_phone_number(kwargs.get('phone'))
        client.phone_2 = trim_phone_number(kwargs.get('phone_2'))
        client.email = kwargs.get('email')
        client.vk_link = kwargs.get('vk_link')
        client.odnoklassniki_link = kwargs.get('odnoklassniki_link')
        client.instagram_link = kwargs.get('instagram_link')
        client.facebook_link = kwargs.get('facebook_link')
        client.secondby_link = kwargs.get('secondby_link')
        client.comments = kwargs.get('comments')
        client.save()

        return client

    def update_or_create(self, defaults=None, **kwargs):
        from orders_manager.utils.data_utils import trim_phone_number
        try:
            client = self.get(phone=trim_phone_number(kwargs.get('phone')))
            for attr, val in kwargs.items():
                if hasattr(client, attr) and attr != 'phone':
                    setattr(client, attr, val)
            client.save()
        except self.model.DoesNotExist:
            client = self.create(**kwargs)
        return client

    def search(self, key):
        return self.filter(
            Q(name__icontains=key) | Q(phone__contains=key)).all()


class ClientChildrenManager(models.Manager):
    def create(self, **kwargs):
        from orders_manager.models import ClientChild

        client_child = ClientChild()
        client_child.name = kwargs.get('name')
        client_child.client_id = kwargs.get('client_id')
        if kwargs.get('birthday'):
            client_child.birthday = kwargs.get('birthday')
        else:
            current_age = kwargs.get('age')
            celebrate_date = kwargs.get('celebrate_date')
            client_child.birthday = self._calculate_child_birthday(
                current_age, celebrate_date)
        client_child.save()
        return client_child

    def update_or_create(self, defaults=None, **kwargs):
        try:
            child = self.get(name=kwargs.get('name'))
            child.client_id = kwargs.get('client_id')

            if kwargs.get('birthday'):
                child.birthday = kwargs.get('birthday')
            else:
                child.birthday = self._calculate_child_birthday(
                    kwargs.get('age'),
                    kwargs.get('celebrate_date')
                )
            child.save()
        except self.model.DoesNotExist:
            child = self.create(**kwargs)
        return child

    def _calculate_child_birthday(self, current_age, celebrate_date):
        import datetime

        def clean_celebrate_date(celebrate_date):
            import re
            row_data = re.search('Дата: (?P<date>[\d.]{10})', celebrate_date)
            if row_data:
                return datetime.datetime.strptime(
                    row_data.group('date'), '%d.%m.%Y')
            row_data = re.search('^(?P<date>[\d-]{10})$', celebrate_date)
            if row_data:
                return datetime.datetime.strptime(
                    row_data.group('date'), '%Y-%m-%d')
            return None

        celebrate_date = clean_celebrate_date(celebrate_date)
        date_time = celebrate_date.replace(
            year=(celebrate_date.year - (int(current_age) + 1))
        )
        return date_time.strftime('%Y-%m-%d')


class ProgramManager(models.Manager):
    def create(self, **kwargs):
        from orders_manager.models import Program, UserProfile

        program = Program()
        program.title = kwargs.get('title')
        program.characters = kwargs.get('characters')
        program.num_executors = kwargs.get('num_executors')

        program.save()

        for pos_executor in kwargs.get('possible_executors'):
            ex = UserProfile.objects.get(user_id=pos_executor.user.id)
            program.possible_executors.add(ex)
        program.save()

        return program

    def update_or_create(self, defaults=None, **kwargs):
        from orders_manager.models import UserProfile

        try:
            program = self.get(title=kwargs.get('title'))
            program.characters = kwargs.get('characters')
            program.num_executors = kwargs.get('num_executors')

            program.possible_executors = UserProfile.objects.none()

            for pos_executor in kwargs.get('possible_executors'):
                ex = UserProfile.objects.get(user_id=pos_executor.user.id)
                program.possible_executors.add(ex)

            program.save()
        except self.model.DoesNotExist:
            program = self.create(**kwargs)
        return program

    def all(self):
        return super(ProgramManager, self).all().order_by('title')


class ProgramPriceManager(models.Manager):
    def create(self, **kwargs):
        from orders_manager.models import ProgramPrice

        program_price = ProgramPrice()
        program_price.program_id = kwargs.get('program_id')
        program_price.duration = kwargs.get('duration')
        program_price.price = kwargs.get('price')
        program_price.save()

    def update_or_create(self, defaults=None, **kwargs):
        try:
            program_price = self.get(
                Q(program_id=kwargs.get('program_id')) &
                Q(duration=kwargs.get('duration'))
            )
            program_price.price = kwargs.get('price')
            program_price.save()
        except self.model.DoesNotExist:
            program_price = self.create(**kwargs)
        return program_price


class AdditionalServiceManager(models.Manager):
    def create(self, **kwargs):
        from orders_manager.models import AdditionalService, UserProfile

        service = AdditionalService()
        for attr_name in ('title', 'num_executors', 'price'):
            setattr(service, attr_name, kwargs.get(attr_name))

        service.save()

        for pos_executor in kwargs.get('possible_executors'):
            ex = UserProfile.objects.get(user_id=pos_executor.user.id)
            service.possible_executors.add(ex)
        service.save()

        return service

    def update_or_create(self, defaults=None, **kwargs):
        from orders_manager.models import UserProfile

        try:
            service = self.get(title=kwargs.get('title'))
            for attr_name in ('num_executors', 'price'):
                setattr(service, attr_name, kwargs.get(attr_name))

            service.possible_executors = UserProfile.objects.none()

            for pos_executor in kwargs.get('possible_executors'):
                ex = UserProfile.objects.get(user_id=pos_executor.user.id)
                service.possible_executors.add(ex)

            service.save()
        except self.model.DoesNotExist:
            service = self.create(**kwargs)
        return service

    def all(self):
        return super(AdditionalServiceManager, self).all().order_by('title')


class OrdersManager(models.Manager):
    def create(self, **kwargs):
        from orders_manager.models import Order, AdditionalService, Discount, \
            Program, ClientChild, Client

        order = Order()
        order.code = '{0}-{1}'.format(
            format_date(pattern='%Y%m%d'),
            generate_str(num_chars=3)
        )
        order.author_id = kwargs.get('author_id')
        order.client_id = kwargs.get('client_id')
        order.celebrate_date = kwargs.get('celebrate_date')
        order.celebrate_time = kwargs.get('celebrate_time')
        order.celebrate_place = kwargs.get('celebrate_place')
        order.address = kwargs.get('address')
        order.program_id = kwargs.get('program_id')
        order.duration = kwargs.get('duration')
        order.price = kwargs.get('price')
        order.total_price = kwargs.get('total_price')
        order.total_price_with_discounts = kwargs.get(
            'total_price_with_discounts')
        order.status = kwargs.get('status')
        order.details = kwargs.get('details')
        order.executor_comment = kwargs.get('executor_comment')

        order.save()

        for child_id in kwargs.get('client_children_id'):
            child = ClientChild.objects.get(id=child_id)
            order.client_children.add(child)

        for service_id in kwargs.get('additional_services_id'):
            serv = AdditionalService.objects.get(id=service_id)
            order.additional_services.add(serv)

        for discount_id in kwargs.get('discounts_id'):
            discount = Discount.objects.get(id=discount_id)
            order.discounts.add(discount)

        return order
