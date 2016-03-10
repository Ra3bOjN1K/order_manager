# -*- coding: utf-8 -*-

from django.contrib.auth.models import Permission
from rest_framework import serializers
from orders_manager.models import (UserProfile, Client, Order, Program,
    AdditionalService, ClientChild, ProgramPrice, Discount, DayOff,
    AnimatorDebt, SmsDeliveryEvent, SmsDeliveryMessage, SmsDeliveryCredentials)
from orders_manager.transliterate_service import transliterate_message


class DynamicFieldsModelSerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        fields = kwargs.pop('required_fields', None)

        super(DynamicFieldsModelSerializer, self).__init__(*args, **kwargs)

        if fields is not None:
            allowed = set(fields)
            existing = set(self.fields.keys())
            for field_name in existing - allowed:
                self.fields.pop(field_name)


class UserPermissionSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = Permission
        fields = ('codename',)


class UserProfileSerializer(DynamicFieldsModelSerializer):
    id = serializers.CharField(source='user.id', required=False)
    username = serializers.CharField(source='user.username')
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    full_name = serializers.SerializerMethodField()
    email = serializers.CharField(source='user.email')
    role = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = '__all__'
        extra_kwargs = {
            'weekends': {'required': False},
            'user': {
                'required': False,
                'validators': []
            }
        }

    def get_full_name(self, obj):
        return '{0.user.last_name} {0.user.first_name}'.format(obj)

    def get_role(self, obj):
        return obj.get_role_name()


class ClientSerializer(DynamicFieldsModelSerializer):
    id = serializers.CharField()

    class Meta:
        model = Client
        extra_kwargs = {
            'name': {'required': False}
        }


class ClientChildrenSerializer(DynamicFieldsModelSerializer):
    id = serializers.CharField(required=False)
    age = serializers.SerializerMethodField()

    class Meta:
        model = ClientChild

    def get_age(self, obj):
        def _check_age_lbl(age):
            if age > 0 and age // 10 != 1:
                if age % 10 == 1:
                    return 'год'
                elif age % 10 in (2, 3, 4):
                    return 'года'
                else:
                    return 'лет'
            else:
                return 'лет'

        return '%d %s' % (obj.age(), _check_age_lbl(obj.age()))

    def get_unique_together_validators(self):
        return []

    def create(self, validated_data):
        validated_data.update({'client_id': validated_data.get('client').id})
        del validated_data['client']
        instance = ClientChild.objects.update_or_create(**validated_data)

        return instance


class ProgramSerializer(DynamicFieldsModelSerializer):
    id = serializers.CharField(required=False)
    possible_executors = UserProfileSerializer(
        required_fields=['id', 'full_name', 'role'], many=True, required=False)

    class Meta:
        model = Program
        extra_kwargs = {
            'characters': {'required': False},
            'title': {'required': False}
        }

    def create(self, validated_data):
        if validated_data.get('id'):
            instance = Program.objects.update_or_create(**validated_data)
        else:
            instance = Program.objects.create(**validated_data)

        return instance


class ProgramPriceSerializer(DynamicFieldsModelSerializer):
    id = serializers.CharField(required=False)
    characters = serializers.CharField(required=False)

    class Meta:
        model = ProgramPrice

    def get_unique_together_validators(self):
        return []

    def create(self, validated_data):
        validated_data.update({'program_id': validated_data.get('program').id})
        del validated_data['program']

        instance = ProgramPrice.objects.update_or_create(**validated_data)

        return instance


class AdditionalServiceSerializer(DynamicFieldsModelSerializer):
    id = serializers.CharField(required=False)
    possible_executors = UserProfileSerializer(
        required_fields=['id', 'full_name', 'role'], many=True, required=False)

    class Meta:
        model = AdditionalService
        extra_kwargs = {
            'title': {'required': False}
        }

    def create(self, validated_data):
        if validated_data.get('id'):
            instance = AdditionalService.objects.update_or_create(
                **validated_data)
        else:
            instance = AdditionalService.objects.create(**validated_data)

        return instance


class DiscountSerializer(DynamicFieldsModelSerializer):
    id = serializers.CharField(required=False)

    class Meta:
        model = Discount


class OrderSerializer(DynamicFieldsModelSerializer):
    id = serializers.CharField(required=False)

    code = serializers.CharField(required=False, read_only=True)
    author = UserProfileSerializer(required_fields=['id', 'full_name', 'role'],
                                   required=False)
    client = ClientSerializer(required_fields=['id'])
    client_children = ClientChildrenSerializer(required_fields=['id'],
                                               many=True)
    program = ProgramSerializer(required_fields=['id', 'title'])
    program_executors = UserProfileSerializer(
        required_fields=['id', 'full_name'], many=True, required=False)
    additional_services_executors = serializers.SerializerMethodField()
    discount = DiscountSerializer(required_fields=['id'])
    is_only_service_executor = serializers.SerializerMethodField(read_only=True)
    debt = serializers.SerializerMethodField(required=False)

    class Meta:
        model = Order

    def get_additional_services_executors(self, obj):
        data = []

        for item in obj.additional_services_executors.all():
            serv_id = str(item.additional_service.id)
            if serv_id not in [x.get('id') for x in data]:
                data.append({
                    'id': str(serv_id),
                    'service_name': item.additional_service.title,
                    'executors': []
                })
            for data_serv in data:
                if data_serv.get('id') == str(serv_id) and item.executor:
                    data_serv['executors'].append({
                        'id': str(item.executor.user.id)
                    })

        return data

    def get_is_only_service_executor(self, obj):
        from orders_manager.roles import get_user_role

        request = self.context.get('request')
        if request:
            user = request.user
            role = get_user_role(user)
            if role in ['superuser', 'manager']:
                return False
            if user.id not in [i.user.id for i in obj.program_executors.all()]:
                for service_to_executor in obj.additional_services_executors.all():
                    if service_to_executor.executor.user.id == user.id:
                        return True
        return False

    def get_debt(self, obj):
        debt = obj.animator_debts.first()
        return {
            'id': debt.id if debt else -1,
            'paid': debt.paid if debt else False
        }

    def create(self, validated_data):
        client_children = [x.get('id') for x in validated_data.get(
            'client_children')]
        validated_data['client_children'] = client_children
        program_executors = [x.get('user').get('id') for x in
                             validated_data.get('program_executors')]
        validated_data['program_executors'] = program_executors

        additional_services_executors = self.initial_data.get(
            'additional_services_executors')
        validated_data['additional_services_executors'] = \
            additional_services_executors

        if validated_data.get('id'):
            instance = Order.objects.update(**validated_data)
        else:
            instance = Order.objects.create(**validated_data)

        return instance


class DayOffSerializer(DynamicFieldsModelSerializer):
    id = serializers.CharField(required=False)
    user_full_name = serializers.SerializerMethodField()
    date = serializers.CharField()
    time_start = serializers.CharField()
    time_end = serializers.CharField()
    created = serializers.CharField(read_only=True)

    class Meta:
        model = DayOff

    def get_user_full_name(self, obj):
        return obj.user_profile.get_full_name()


class AnimatorDebtSerializer(DynamicFieldsModelSerializer):
    executor = UserProfileSerializer(required_fields=['id', 'full_name'])
    order = OrderSerializer(
        required_fields=['id', 'program', 'celebrate_date', 'celebrate_time',
                         'additional_services_executors',
                         'total_price_with_discounts'])
    animator_salary = serializers.SerializerMethodField()
    animator_month_salary_info = serializers.SerializerMethodField()

    class Meta:
        model = AnimatorDebt

    def get_animator_salary(self, obj):
        salary = obj.order.get_executor_salary(obj.executor)
        return salary

    def get_animator_month_salary_info(self, obj):
        month_num, salary = obj.executor.get_month_salary_info()
        return {
            'celebrations_num': month_num,
            'salary': salary
        }


class SmsDeliveryEventSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = SmsDeliveryEvent


class SmsDeliveryEventListSerializer(serializers.ListSerializer):
    child = SmsDeliveryEventSerializer()


class SmsDeliveryMessageSerializer(DynamicFieldsModelSerializer):
    order = serializers.SerializerMethodField()
    event = SmsDeliveryEventSerializer(required_fields=['name'])
    message = serializers.SerializerMethodField()

    class Meta:
        model = SmsDeliveryMessage

    def get_order(self, obj):
        return {
            'client': {
                'id': obj.order.client.id,
                'name': obj.order.client.name,
                'phone': obj.order.client.phone,
                'phone_2': obj.order.client.phone_2,
            }
        }

    def get_message(self, obj):
        settings = SmsDeliveryCredentials.objects.first()
        message = obj.format_message()
        if settings and settings.transliterate:
            message = transliterate_message(message)
        return message


class SmsDeliveryMessageListSerializer(serializers.ListSerializer):
    child = SmsDeliveryMessageSerializer()
