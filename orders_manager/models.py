# -*- coding: utf-8 -*-

from django.db import models
from django.db.models import Q
from django.db.models.signals import post_save
from django.contrib.auth.models import User
from orders_manager.managers import (UserProfileManager, ClientManager,
    ProgramManager, AdditionalServiceManager, OrdersManager,
    ClientChildrenManager, ProgramPriceManager, DayOffManager)
from orders_manager.utils.data_utils import calculate_age
from orders_manager.roles import ROLES, get_user_role
from oauth2client.django_orm import CredentialsField


class CredentialsModel(models.Model):
    id = models.OneToOneField(User, primary_key=True)
    credential = CredentialsField()


class UserProfile(models.Model):
    user = models.OneToOneField(User, primary_key=True, related_name='profile')
    address = models.TextField(null=False, blank=False)
    phone = models.CharField(max_length=20, null=False, blank=False)
    created = models.DateTimeField(auto_now_add=True)

    objects = UserProfileManager()

    class Meta:
        permissions = (
            ('see_all_profiles', 'Can see all profiles'),
            ('see_executors', 'Can see executors'),
            ('see_profile_details', 'Can see profile details'),
        )

    def __str__(self):
        return self.get_username()

    def get_username(self):
        return self.user.username

    def get_first_name(self):
        return self.user.first_name

    def get_last_name(self):
        return self.user.last_name

    def get_full_name(self):
        full_name = ''
        if self.user.last_name:
            full_name += '%s ' % self.user.last_name
        if self.user.first_name:
            full_name += self.user.first_name
        return full_name.strip()

    def get_address(self):
        return self.address

    def get_email(self):
        return self.user.email

    def get_phone(self):
        return self.phone

    def get_role_name(self):
        role_code = get_user_role(self.user)
        return {key: val for key, val in ROLES}[role_code]

    def deactivate(self):
        self.user.is_active = False
        self.user.save()


class DayOff(models.Model):
    user_profile = models.ForeignKey(UserProfile, related_name='days_off')
    date = models.DateField()
    time_start = models.TimeField(default='00:00:00')
    time_end = models.TimeField(default='23:59:59')

    objects = DayOffManager()


class Client(models.Model):
    name = models.CharField(max_length=64, verbose_name='Имя заказчика')
    phone = models.CharField(max_length=20, verbose_name='Телефон заказчика')
    phone_2 = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    vk_link = models.CharField(max_length=64, null=True, blank=True)
    odnoklassniki_link = models.CharField(max_length=64, null=True, blank=True)
    instagram_link = models.CharField(max_length=64, null=True, blank=True)
    facebook_link = models.CharField(max_length=64, null=True, blank=True)
    secondby_link = models.CharField(max_length=64, null=True, blank=True)
    comments = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    objects = ClientManager()

    class Meta:
        permissions = (
            ('see_client', 'Can see client'),
            ('see_client_details', 'Can see client details'),
        )

    def __str__(self):
        return self.name

    def activate(self):
        self.is_active = True
        self.save()

    def deactivate(self):
        self.is_active = False
        self.save()


class ClientChild(models.Model):
    name = models.CharField(max_length=64)
    birthday = models.DateField(null=False, blank=False)
    client = models.ForeignKey(Client, related_name='children')
    is_active = models.BooleanField(default=True)

    objects = ClientChildrenManager()

    class Meta:
        permissions = (
            ('see_client_children', 'Can see client children'),
        )
        unique_together = ('client', 'name')

    def __str__(self):
        return self.name

    def age(self):
        return calculate_age(self.birthday)

    def activate(self):
        self.is_active = True
        self.save()

    def deactivate(self):
        self.is_active = False
        self.save()


class AdditionalService(models.Model):
    title = models.CharField(max_length=200, null=False, blank=False)
    price = models.IntegerField(null=False, blank=False)
    num_executors = models.PositiveSmallIntegerField(default=1)
    possible_executors = models.ManyToManyField(UserProfile,
                                                related_name='services')
    is_active = models.BooleanField(default=True)

    objects = AdditionalServiceManager()

    class Meta:
        permissions = (
            ('see_additionalservices', 'Can see additional services'),
            ('assign_additionalservice', 'Can assign service'),
        )

    def __str__(self):
        return self.title

    def activate(self):
        self.is_active = True
        self.save()

    def deactivate(self):
        self.is_active = False
        self.save()


class Program(models.Model):
    title = models.CharField(max_length=200)
    characters = models.CharField(max_length=250)
    num_executors = models.PositiveSmallIntegerField(default=1)
    possible_executors = models.ManyToManyField(UserProfile,
                                                related_name='programs')
    is_active = models.BooleanField(default=True)

    objects = ProgramManager()

    class Meta:
        permissions = (
            ('see_programs', 'Can see programs'),
            ('see_program_details', 'Can see program details'),
        )
        verbose_name = "Программа"

    def __str__(self):
        return self.title

    def get_all_prices(self):
        return ProgramPrice.objects.filter(program__pk=self.id).order_by(
            'duration').all()

    def get_price(self, duration):
        price = ProgramPrice.objects.filter(
            Q(program__id=self.id) & Q(duration=duration)
        ).first()
        if not price:
            raise AttributeError('Duration for this program has not been set..')
        return price.price

    def activate(self):
        self.is_active = True
        self.save()

    def deactivate(self):
        self.is_active = False
        self.save()


class ProgramPrice(models.Model):
    program = models.ForeignKey(Program, related_name='prices')
    duration = models.IntegerField(null=False, blank=False)
    price = models.IntegerField(null=False, blank=False)

    objects = ProgramPriceManager()

    class Meta:
        permissions = (
            ('see_program_prices', 'Can see program prices'),
        )
        unique_together = ('program', 'duration')


class Discount(models.Model):
    name = models.CharField(max_length=64, null=False, blank=False)
    value = models.SmallIntegerField(null=False, blank=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        permissions = (
            ('see_discounts', 'Can see discounts'),
        )

    def __str__(self):
        return self.name

    def activate(self):
        self.is_active = True
        self.save()

    def deactivate(self):
        self.is_active = False
        self.save()


class OrderServiceExecutors(models.Model):
    executor = models.ForeignKey(UserProfile, null=True, blank=True)
    additional_service = models.ForeignKey(AdditionalService)


class Order(models.Model):
    code = models.CharField(max_length=12, unique=True)
    author = models.ForeignKey(UserProfile, related_name='created_orders')
    client = models.ForeignKey(Client, verbose_name='Заказчик')
    client_children = models.ManyToManyField(
        ClientChild,
        verbose_name='Виновник(-и) торжества'
    )

    children_num = models.SmallIntegerField(verbose_name='Количество детей')
    celebrate_date = models.DateField(verbose_name='Дата торжества')
    celebrate_time = models.TimeField(verbose_name='Время торжества')
    celebrate_place = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        verbose_name='Место проведения'
    )

    address = models.TextField(name='address', verbose_name='Адрес проведения')
    program = models.ForeignKey(Program, verbose_name='Программа')
    program_executors = models.ManyToManyField(UserProfile,
                                               related_name='orders')

    duration = models.IntegerField(verbose_name='Продолжительность')
    price = models.IntegerField(verbose_name='Стоимость')
    additional_services_executors = models.ManyToManyField(OrderServiceExecutors)
    details = models.TextField(
        verbose_name='Подробности', blank=True, null=True)
    executor_comment = models.TextField(
        verbose_name='Комментарии исполнителя', blank=True, null=True)
    where_was_found = models.CharField(
        max_length=64, null=True, blank=True,
        verbose_name='Откуда узнали о нас?')
    discount = models.ForeignKey(
        Discount, related_name='orders', verbose_name='Скидка')
    cost_of_the_way = models.IntegerField(
        verbose_name='Стоимость дороги', default=0)
    total_price = models.IntegerField(verbose_name='Цена')
    total_price_with_discounts = models.IntegerField(
        verbose_name='Цена с учетом скидки'
    )

    created = models.DateTimeField(auto_now_add=True)

    objects = OrdersManager()

    class Meta:
        permissions = (
            ('see_handbooks', 'Can see handbooks'),
            ('see_orders', 'Can see orders'),
            ('assign_order', 'Can assign order'),
        )


def set_superuser_permissions(sender, instance, created, **kwargs):
    from orders_manager.roles import Superuser

    if created and instance.username == 'admin':
        Superuser.assign_role_to_user(instance)
        profile = UserProfile()
        profile.user = instance
        profile.address = ''
        profile.phone = ''
        profile.save()


post_save.connect(set_superuser_permissions, sender=User)
