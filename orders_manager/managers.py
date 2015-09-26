# -*- coding: utf-8 -*-

from django.db import models
from django.contrib.auth.models import User

from orders_manager.roles import Manager as ProjectManager, Animator, \
    Photographer
from orders_manager.utils.data_utils import generate_str, format_date


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
        profile.set_weekends(kwargs.get('weekends'))
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
            user__groups__name='animator').all()

    def all_managers(self):
        return self._all_active().filter(
            user__groups__name='manager').all()

    def all_photographers(self):
        return self._all_active().filter(
            user__groups__name='photographer').all()


class ClientManager(models.Manager):
    def create(self, **kwargs):
        from orders_manager.models import Client

        client = Client()
        client.name = kwargs.get('name')
        client.phone = kwargs.get('phone')
        client.phone_2 = kwargs.get('phone_2')
        client.email = kwargs.get('email')
        client.vk_link = kwargs.get('vk_link')
        client.odnoklassniki_link = kwargs.get('odnoklassniki_link')
        client.instagram_link = kwargs.get('instagram_link')
        client.facebook_link = kwargs.get('facebook_link')
        client.secondby_link = kwargs.get('secondby_link')
        client.comments = kwargs.get('comments')
        client.save()

        return client


class ProgramManager(models.Manager):
    def create(self, **kwargs):
        from orders_manager.models import Program, Character

        program = Program()
        program.title = kwargs.get('title')
        program.num_executors = kwargs.get('num_executors')

        program.save()

        for character_id in kwargs.get('characters_id'):
            ch = Character.objects.get(id=character_id)
            program.characters.add(ch)

        for pos_executor_id in kwargs.get('possible_executors_id'):
            ex = User.objects.get(id=pos_executor_id)
            program.possible_executors.add(ex)

        for executor_id in kwargs.get('executors_id'):
            ex = User.objects.get(id=executor_id)
            program.executors.add(ex)

        return program


class AdditionalServiceManager(models.Manager):
    def create(self, **kwargs):
        from orders_manager.models import User, AdditionalService

        service = AdditionalService()
        service.name = kwargs.get('name')
        service.price = kwargs.get('price')
        service.description = kwargs.get('description')
        service.save()

        for ex_id in kwargs.get('executors_id'):
            executor = User.objects.get(id=ex_id)
            service.executors.add(executor)

        return service


class OrdersManager(models.Manager):
    def create(self, **kwargs):
        from orders_manager.models import Order, AdditionalService, Discount, \
            Program, ClientChild, Client

        order = Order()
        order.code = '{0}-{1}'.format(
            format_date(pattern='%Y%m%d'),
            generate_str(num_chars=3)
        )
        order.author = User.objects.get(id=kwargs.get('author_id'))
        order.client = Client.objects.get(id=kwargs.get('client_id'))
        order.celebrate_date = kwargs.get('celebrate_date')
        order.celebrate_time = kwargs.get('celebrate_time')
        order.celebrate_place = kwargs.get('celebrate_place')
        order.address = kwargs.get('address')
        order.program = Program.objects.get(id=kwargs.get('program_id'))
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
