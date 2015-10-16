import json

from django.db import models
from django.db.models import Q
from django.contrib.auth.models import User

from rolepermissions.shortcuts import get_user_role

from orders_manager.managers import UserProfileManager, ClientManager, \
    ProgramManager, AdditionalServiceManager, OrdersManager, \
    ClientChildrenManager, ProgramPriceManager
from orders_manager.utils.data_utils import calculate_age
from orders_manager.roles import ROLES


class Weekends(models.Model):
    date = models.DateField()


class UserProfile(models.Model):
    user = models.OneToOneField(User, primary_key=True, related_name='profile')
    address = models.TextField(null=False, blank=False)
    phone = models.CharField(max_length=20, null=False, blank=False)
    weekends = models.ManyToManyField(Weekends)
    created = models.DateTimeField(auto_now_add=True)

    objects = UserProfileManager()

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

    def get_bonus_for_program(self, program_id):
        bonus = AnimatorBonuses.objects.filter(
            Q(program__id=program_id) & Q(executor__id=self.user.id)
        ).first()
        return bonus.bonus if bonus else 0

    def get_role_name(self):
        role_code = get_user_role(self.user).get_name()
        return {key: val for key, val in ROLES}[role_code]

    def make_inactive(self):
        self.user.is_active = False
        self.user.save()


class Client(models.Model):
    name = models.CharField(max_length=64, verbose_name='Имя заказчика')
    phone = models.CharField(max_length=20, verbose_name='Телефон заказчика',
                             unique=True)
    phone_2 = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    vk_link = models.CharField(max_length=64, null=True, blank=True)
    odnoklassniki_link = models.CharField(max_length=64, null=True, blank=True)
    instagram_link = models.CharField(max_length=64, null=True, blank=True)
    facebook_link = models.CharField(max_length=64, null=True, blank=True)
    secondby_link = models.CharField(max_length=64, null=True, blank=True)
    comments = models.TextField(null=True, blank=True)

    objects = ClientManager()

    def __str__(self):
        return self.name


class ClientChild(models.Model):
    name = models.CharField(max_length=64)
    birthday = models.DateField(null=False, blank=False)
    client = models.ForeignKey(Client, related_name='children')

    objects = ClientChildrenManager()

    class Meta:
        unique_together = ('client', 'name')

    def __str__(self):
        return self.name

    def age(self):
        return calculate_age(self.birthday)


class AdditionalService(models.Model):
    title = models.CharField(max_length=200, null=False, blank=False)
    price = models.FloatField(null=False, blank=False)
    num_executors = models.PositiveSmallIntegerField(default=1)
    possible_executors = models.ManyToManyField(UserProfile,
                                                related_name='services')

    objects = AdditionalServiceManager()

    def __str__(self):
        return self.title


class Program(models.Model):
    title = models.CharField(max_length=200, unique=True)
    characters = models.CharField(max_length=250)
    num_executors = models.PositiveSmallIntegerField(default=1)
    possible_executors = models.ManyToManyField(UserProfile,
                                                related_name='programs')

    objects = ProgramManager()

    class Meta:
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


class ProgramPrice(models.Model):
    program = models.ForeignKey(Program, related_name='prices')
    duration = models.IntegerField(null=False, blank=False)
    price = models.IntegerField(null=False, blank=False)

    objects = ProgramPriceManager()

    class Meta:
        unique_together = ('program', 'duration')


class AnimatorBonuses(models.Model):
    program = models.ForeignKey(Program)
    executor = models.ForeignKey(UserProfile)
    bonus = models.FloatField(null=False, blank=False)

    class Meta:
        unique_together = ('program', 'executor')


class Discount(models.Model):
    name = models.CharField(max_length=64, null=False, blank=False)
    value = models.SmallIntegerField(null=False, blank=False)

    def __str__(self):
        return self.name


class Order(models.Model):
    code = models.CharField(max_length=12, unique=True)
    author = models.ForeignKey(User, null=False, blank=False)
    client = models.ForeignKey(Client, verbose_name='Заказчик')
    client_children = models.ManyToManyField(
        ClientChild,
        verbose_name='Виновник(-и) торжества'
    )
    celebrate_date = models.DateTimeField(verbose_name='Дата торжества')
    celebrate_place = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        verbose_name='Место проведения'
    )
    _address = models.TextField(
        name='address',
        verbose_name='Адрес проведения',
        default='{"address": {"city": "г.Минск", "street": "ул. Маяковского", "house": "16б", "housing": "2", "apartment": "46", "description": "Как проехать?"}}')
    program = models.ForeignKey(Program, verbose_name='Программа')
    program_executors = models.ManyToManyField(UserProfile,
                                               related_name='orders')
    duration = models.IntegerField(verbose_name='Продолжительность')
    price = models.IntegerField(verbose_name='Стоимость')
    additional_services = models.ManyToManyField(
        AdditionalService,
        related_name='orders',
        verbose_name='Дополнительные услуги'
    )
    services_executors = models.ManyToManyField(UserProfile)
    details = models.TextField(verbose_name='Подробности')
    executor_comment = models.TextField(verbose_name='Комментарии исполнителя')
    discount = models.ForeignKey(Discount, related_name='orders',
                                 verbose_name='Скидка')
    total_price = models.FloatField(verbose_name='Цена')
    total_price_with_discounts = models.FloatField(
        verbose_name='Цена с учетом скидки'
    )
    created = models.DateTimeField(auto_now_add=True)

    objects = OrdersManager()


class AddressParser:
    class Address:
        def __init__(self, data):
            self.__dict__.update(data)

    def parse_string(self, address_str):
        address_dict = json.loads(address_str)
        return self.Address(address_dict.get('address'))

    def to_string(self, address):
        pass
