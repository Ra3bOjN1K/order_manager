import json

from django.db import models
from django.db.models import Q
from django.contrib.auth.models import User

from rolepermissions.shortcuts import get_user_role

from orders_manager.managers import UserProfileManager, ClientManager, \
    ProgramManager, AdditionalServiceManager, OrdersManager
from orders_manager.utils.data_utils import calculate_age, \
    day_of_month_full_name
from orders_manager.roles import ROLES

DAY_MULTIPLE_CHOICES = (
    ('mon', 'ПН'),
    ('tue', 'ВТ'),
    ('wed', 'СР'),
    ('thu', 'ЧТ'),
    ('fri', 'ПТ'),
    ('sat', 'СБ'),
    ('sun', 'ВС'),
)


class UserProfile(models.Model):
    user = models.OneToOneField(User, primary_key=True, related_name='profile')
    address = models.TextField(null=False, blank=False)
    phone = models.CharField(max_length=20, null=False, blank=False)
    weekends = models.CharField(max_length=200, null=False, blank=False)
    created = models.DateTimeField(auto_now_add=True)

    objects = UserProfileManager()

    def set_weekends(self, days):
        self.weekends = json.dumps(days)

    def get_weekends(self):
        return json.loads(self.weekends)

    def get_weekends_names(self):
        weekends = json.loads(self.weekends)

        def weekend_name(w_code):
            return {key: val for key, val in DAY_MULTIPLE_CHOICES}[w_code]

        return ', '.join(
            [day_of_month_full_name(weekend_name(code)) for code in weekends]
        )

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


class ClientChild(models.Model):
    name = models.CharField(max_length=64, null=False, blank=False)
    birthday = models.DateField(null=False, blank=False)

    def age(self):
        return calculate_age(self.birthday)


class Client(models.Model):
    name = models.CharField(max_length=64, null=False, blank=False)
    children = models.ManyToManyField(ClientChild, related_name='parents')
    phone = models.CharField(max_length=20, null=False, blank=False)
    phone_2 = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    vk_link = models.CharField(max_length=64, null=True, blank=True)
    odnoklassniki_link = models.CharField(max_length=64, null=True, blank=True)
    instagram_link = models.CharField(max_length=64, null=True, blank=True)
    facebook_link = models.CharField(max_length=64, null=True, blank=True)
    secondby_link = models.CharField(max_length=64, null=True, blank=True)
    comments = models.TextField(null=True, blank=True)

    objects = ClientManager()


class Character(models.Model):
    name = models.CharField(max_length=64)


class AdditionalService(models.Model):
    name = models.CharField(max_length=200, null=False, blank=False)
    price = models.FloatField(null=False, blank=False)
    description = models.TextField(null=True, blank=True)
    executors = models.ManyToManyField(User, related_name='services')

    objects = AdditionalServiceManager()


class Program(models.Model):
    title = models.CharField(max_length=200, null=False, blank=False)
    characters = models.ManyToManyField(Character, related_name='orders')
    num_executors = models.SmallIntegerField(null=False, blank=False)
    possible_executors = models.ManyToManyField(User, related_name='programs')
    executors = models.ManyToManyField(User, related_name='orders')

    objects = ProgramManager()

    def get_all_prices(self):
        return ProgramPrice.objects.filter(program__pk=self.id).all()

    def get_price(self, duration):
        price = ProgramPrice.objects.filter(
            Q(program__id=self.id) & Q(duration=duration)
        ).first()
        return price.price if price else 0


class ProgramPrice(models.Model):
    program = models.ForeignKey(Program)
    duration = models.FloatField(null=False, blank=False)
    price = models.FloatField(null=False, blank=False)

    class Meta:
        unique_together = ('program', 'duration')


class AnimatorBonuses(models.Model):
    program = models.ForeignKey(Program)
    executor = models.ForeignKey(User)
    bonus = models.FloatField(null=False, blank=False)

    class Meta:
        unique_together = ('program', 'executor')


class Discount(models.Model):
    name = models.CharField(max_length=64, null=False, blank=False)
    value = models.SmallIntegerField(null=False, blank=False)


class Order(models.Model):
    STATUSES = (
        ('soon', 'Скоро'),
        ('today', 'Сегодня'),
        ('gone', 'Прошло')
    )

    code = models.CharField(max_length=12, unique=True)
    author = models.ForeignKey(User, null=False, blank=False)
    client = models.ForeignKey(Client)
    client_children = models.ManyToManyField(ClientChild)
    celebrate_date = models.DateField()
    celebrate_time = models.TimeField()
    celebrate_place = models.CharField(max_length=64, null=False, blank=False)
    address = models.TextField(null=False, blank=False)
    program = models.ForeignKey(Program)
    duration = models.FloatField(null=False, blank=False)
    price = models.FloatField()
    additional_services = models.ManyToManyField(AdditionalService,
                                                 related_name='orders')
    details = models.TextField()
    executor_comment = models.TextField()
    discounts = models.ManyToManyField(Discount, related_name='orders')
    total_price = models.FloatField()
    total_price_with_discounts = models.FloatField()
    status = models.CharField(max_length=5, choices=STATUSES)
    created = models.DateTimeField(auto_now_add=True)

    objects = OrdersManager()

# TODO: Добавить справочник "ГДЕ НАШЛИ"
