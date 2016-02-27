# -*- coding: utf-8 -*-

from datetime import datetime, date
from django.db import models
from django.db.models import Q, Sum, Count
from django.contrib.auth.models import User
from orders_manager.roles import (Manager as ProjectManager, Animator,
    Photographer, AbstractUserRole)
from orders_manager.utils.data_utils import (generate_str, format_date,
    trim_phone_number)


class UserProfileManager(models.Manager):
    def _create_user(self, **kwargs):
        from orders_manager.models import UserProfile

        user = User()
        user.username = kwargs.get('username')
        user.email = kwargs.get('email')
        user.first_name = kwargs.get('first_name')
        user.last_name = kwargs.get('last_name')
        user.set_password(kwargs.get('password', '12345'))
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

    def update(self, defaults=None, **kwargs):
        user_profile = self.get(user_id=kwargs.pop('user_id'))
        new_user_role = kwargs.pop('role')

        for attr, val in kwargs.items():
            if hasattr(user_profile, attr):
                setattr(user_profile, attr, val)
            else:
                setattr(user_profile.user, attr, val)

        if not user_profile.user.groups.filter(name=new_user_role).count():
            AbstractUserRole.change_user_role(user_profile, new_user_role)

        user_profile.user.save()
        user_profile.save()

        return user_profile

    def all_active(self):
        return super(UserProfileManager, self).filter(user__is_active=True)

    def all_animators(self):
        return self.all_active().filter(
            user__groups__name='animator').order_by('user__last_name').all()

    def all_managers(self):
        return self.all_active().filter(
            user__groups__name='manager').order_by('user__last_name').all()

    def all_photographers(self):
        return self.all_active().filter(
            user__groups__name='photographer').order_by('user__last_name').all()

    def all_executors(self):
        return self.all_active().filter(
            Q(user__groups__name='animator') |
            Q(user__groups__name='photographer')
        ).order_by('user__groups__name').all()

    def executors_salary_for_period(self, start, end):
        start = datetime.strptime(start, '%Y-%m-%d %H:%M')
        end = datetime.strptime(end, '%Y-%m-%d %H:%M')
        result = []
        for executor in self.all_executors():
            result.append({
                'user_name': executor.get_full_name(),
                'user_role': executor.get_role_name(),
                'total_salary': executor.get_salary_for_period(start, end)[1]
            })
        return result


class DayOffManager(models.Manager):
    def create(self, **kwargs):
        from orders_manager.models import DayOff

        day_off = DayOff()
        day_off.user_profile_id = kwargs.get('user_id')
        day_off.date = kwargs.get('date')
        day_off.time_start = kwargs.get('time_start')
        day_off.time_end = kwargs.get('time_end')
        day_off.save()

        return day_off

    def update_or_create(self, defaults=None, **kwargs):
        try:
            day_off = self.get(id=kwargs.get('id', -1))
            day_off.date = kwargs.get('date')
            day_off.time_start = kwargs.get('time_start')
            day_off.time_end = kwargs.get('time_end')
            day_off.save()

        except self.model.DoesNotExist:
            day_off = self.create(**kwargs)

        return day_off


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
            if kwargs.get('id'):
                client = self.get(id=kwargs.pop('id'))
            else:
                client = self.get(phone=trim_phone_number(kwargs.get('phone')))
            for attr, val in kwargs.items():
                setattr(client, attr, val)
            client.save()
        except self.model.DoesNotExist:
            client = self.create(**kwargs)
        return client

    def all(self):
        return super(ClientManager, self).all().filter(is_active=True)

    def search(self, key):
        return self.all().filter(
            Q(name__icontains=key) | Q(phone__contains=key))


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
            if kwargs.get('id') and kwargs.get('name'):
                child = self.get(id=kwargs.get('id'))
                child.name = kwargs.get('name')
            else:
                client_id = kwargs.get('client_id')
                child = self.get(
                    Q(name=kwargs.get('name')) &
                    Q(client__id=client_id)
                )

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
        from datetime import datetime

        def clean_celebrate_date(celebrate_date):
            try:
                date = datetime.strptime(celebrate_date,
                                         '%Y-%m-%dT%H:%M:%S.%fZ')
            except ValueError:
                date = datetime.strptime(celebrate_date, '%Y-%m-%d')
            return date

        celebrate_date = clean_celebrate_date(celebrate_date)
        date_time = celebrate_date.replace(
            year=(celebrate_date.year - (int(current_age) + 1))
        )
        return date_time.strftime('%Y-%m-%d')

    def all(self):
        return super(ClientChildrenManager, self).all().filter(is_active=True)


class ProgramManager(models.Manager):
    def create(self, **kwargs):
        from orders_manager.models import Program, UserProfile

        program = Program()
        program.title = kwargs.get('title')
        program.characters = kwargs.get('characters')
        program.num_executors = kwargs.get('num_executors')

        program.save()

        for pos_executor in kwargs.get('possible_executors'):
            user_id = (pos_executor.user.id if isinstance(
                pos_executor, UserProfile) else pos_executor.get('user').get(
                'id'))
            ex = UserProfile.objects.get(user_id=user_id)
            program.possible_executors.add(ex)
        program.save()

        return program

    def update_or_create(self, defaults=None, **kwargs):
        from orders_manager.models import UserProfile

        try:
            program = self.get(id=kwargs.get('id'))
            program.title = kwargs.get('title')
            program.characters = kwargs.get('characters')
            program.num_executors = kwargs.get('num_executors')

            program.possible_executors = UserProfile.objects.none()

            for pos_executor in kwargs.get('possible_executors'):
                user_id = (pos_executor.user.id if isinstance(
                    pos_executor, UserProfile) else pos_executor.get(
                    'user').get('id'))
                ex = UserProfile.objects.get(user_id=user_id)
                program.possible_executors.add(ex)

            program.save()
        except self.model.DoesNotExist:
            program = self.create(**kwargs)
        return program

    def all(self):
        return super(ProgramManager, self).all().filter(
            is_active=True).order_by('id')

    def programs_to_orders_count(self, period_start, period_end):
        start = datetime.strptime(period_start, '%Y-%m-%d %H:%M')
        end = datetime.strptime(period_end, '%Y-%m-%d %H:%M')
        result = []
        for program in self.all():
            result.append({
                'program_name': program.title,
                'orders_count': program.order_set.filter(
                    celebrate_date__range=[start, end]).count()
            })
        return result


class ProgramPriceManager(models.Manager):
    def create(self, **kwargs):
        from orders_manager.models import ProgramPrice

        program_price = ProgramPrice()
        program_price.program_id = kwargs.get('program_id')
        program_price.duration = kwargs.get('duration')
        program_price.price = kwargs.get('price')
        program_price.executor_rate = kwargs.get('executor_rate')
        program_price.save()

        return program_price

    def update_or_create(self, defaults=None, **kwargs):
        try:
            program_price = self.get(
                Q(program_id=kwargs.get('program_id')) &
                Q(duration=kwargs.get('duration'))
            )
            program_price.price = kwargs.get('price')
            program_price.executor_rate = kwargs.get('executor_rate')
            program_price.save()
        except self.model.DoesNotExist:
            program_price = self.create(**kwargs)
        return program_price


class AdditionalServiceManager(models.Manager):
    def create(self, **kwargs):
        from orders_manager.models import AdditionalService, UserProfile

        service = AdditionalService()
        for attr_name in ('title', 'num_executors', 'price', 'executor_rate'):
            setattr(service, attr_name, kwargs.get(attr_name))

        service.save()

        for pos_executor in kwargs.get('possible_executors'):
            user_id = (pos_executor.user.id if isinstance(
                pos_executor, UserProfile) else pos_executor.get('user').get(
                'id'))
            ex = UserProfile.objects.get(user_id=user_id)
            service.possible_executors.add(ex)
        service.save()

        return service

    def update_or_create(self, defaults=None, **kwargs):
        from orders_manager.models import UserProfile

        try:
            service = self.get(id=kwargs.get('id'))

            for attr_name in (
                    'num_executors', 'price', 'title', 'executor_rate'):
                setattr(service, attr_name, kwargs.get(attr_name))

            service.possible_executors = UserProfile.objects.none()

            for pos_executor in kwargs.get('possible_executors'):
                user_id = (pos_executor.user.id if isinstance(
                    pos_executor, UserProfile) else pos_executor.get(
                    'user').get('id'))
                ex = UserProfile.objects.get(user_id=user_id)
                service.possible_executors.add(ex)

            service.save()
        except self.model.DoesNotExist:
            service = self.create(**kwargs)
        return service

    def all(self):
        return super(AdditionalServiceManager, self).all().filter(
            is_active=True).order_by('id')

    def all_possible_executors(self, additional_services_ids):
        possible_executors = set()

        for service_id in additional_services_ids:
            service = self.get(id=service_id)
            possible_executors.update(service.possible_executors.all())

        return list(possible_executors)


class OrdersManager(models.Manager):
    def _get_author(self, **kwargs):
        from orders_manager.models import UserProfile

        if kwargs.get('author_id'):
            author_id = kwargs.get('author_id')
        else:
            author_id = kwargs.get('author').get('user').get('id')
        return UserProfile.objects.get(user_id=author_id)

    def _get_client_id(self, **kwargs):
        if kwargs.get('client_id'):
            client_id = kwargs.get('client_id')
        else:
            client_id = kwargs.get('client').get('id')
        return client_id

    def _get_program_id(self, **kwargs):
        if kwargs.get('program_id'):
            program_id = kwargs.get('program_id')
        else:
            program_id = kwargs.get('program').get('id')
        return program_id

    def _get_discount_id(self, **kwargs):
        if kwargs.get('discount_id'):
            discount_id = kwargs.get('discount_id')
        else:
            discount_id = kwargs.get('discount').get('id')
        return discount_id

    def _get_client_children_ids(self, **kwargs):
        return kwargs.get('client_children') if kwargs.get(
            'client_children') else kwargs.get('client_children_id', [])

    def _get_program_executors_ids(self, **kwargs):
        res = kwargs.get('program_executors') if kwargs.get(
            'program_executors') else kwargs.get('program_executors_id', [])
        return res or []

    def _get_services_to_executors(self, **kwargs):
        return kwargs.get('additional_services_executors', {})

    def _get_additional_services(self, **kwargs):
        res = kwargs.get('additional_services') if kwargs.get(
            'additional_services') else kwargs.get('additional_services_id', [])
        return res or []

    def create(self, **kwargs):
        from orders_manager.models import (Order, AdditionalService,
            ClientChild, OrderServiceExecutors, UserProfile)

        order = Order()
        order.code = '{0}-{1}'.format(
            format_date(pattern='%Y%m%d'),
            generate_str(num_chars=3)
        )

        order.author = self._get_author(**kwargs)
        order.client_id = self._get_client_id(**kwargs)
        order.children_num = kwargs.get('children_num')
        order.celebrate_date = kwargs.get('celebrate_date')
        order.celebrate_time = kwargs.get('celebrate_time')
        order.celebrate_place = kwargs.get('celebrate_place')
        order.address = kwargs.get('address')
        order.program_id = self._get_program_id(**kwargs)
        order.duration = kwargs.get('duration')
        order.price = kwargs.get('price')
        order.discount_id = self._get_discount_id(**kwargs)
        order.total_price = kwargs.get('total_price')
        order.total_price_with_discounts = kwargs.get(
            'total_price_with_discounts')
        order.details = kwargs.get('details')
        order.executor_comment = kwargs.get('executor_comment')
        order.where_was_found = kwargs.get('where_was_found')
        order.cost_of_the_way = kwargs.get('cost_of_the_way')

        order.save()

        for child_id in self._get_client_children_ids(**kwargs):
            child = ClientChild.objects.get(id=child_id)
            order.client_children.add(child)

        for prog_executor_id in self._get_program_executors_ids(**kwargs):
            executor = UserProfile.objects.get(user__id=prog_executor_id)
            order.program_executors.add(executor)

        for item in self._get_services_to_executors(**kwargs):
            for ex in item.get('executors'):
                executor_id = ex.get('id')
                if executor_id and item.get('service_id'):
                    order_serv_obj = OrderServiceExecutors.objects.create(**{
                        'executor_id': executor_id,
                        'additional_service_id': item.get('service_id')
                    })
                    order.additional_services_executors.add(order_serv_obj)
                    order.save()

        # for service_id in self._get_additional_services(**kwargs):
        #     serv = AdditionalService.objects.get(id=service_id)
        #     order.additional_services.add(serv)

        return order

    def update(self, **kwargs):
        from orders_manager.models import (AdditionalService, ClientChild,
            OrderServiceExecutors, UserProfile)

        try:
            order = self.get(id=kwargs.get('id'))

            order.author = self._get_author(**kwargs)
            order.client_id = self._get_client_id(**kwargs)
            order.children_num = kwargs.get('children_num')
            order.celebrate_date = kwargs.get('celebrate_date')
            order.celebrate_time = kwargs.get('celebrate_time')
            order.celebrate_place = kwargs.get('celebrate_place')
            order.address = kwargs.get('address')
            order.program_id = self._get_program_id(**kwargs)
            order.duration = kwargs.get('duration')
            order.price = kwargs.get('price')
            order.discount_id = self._get_discount_id(**kwargs)
            order.total_price = kwargs.get('total_price')
            order.total_price_with_discounts = kwargs.get(
                'total_price_with_discounts')
            order.details = kwargs.get('details')
            order.executor_comment = kwargs.get('executor_comment')
            order.where_was_found = kwargs.get('where_was_found')
            order.cost_of_the_way = kwargs.get('cost_of_the_way')

            order.save()

            order.client_children.clear()
            for child_id in self._get_client_children_ids(**kwargs):
                child = ClientChild.objects.get(id=child_id)
                order.client_children.add(child)

            order.program_executors.clear()
            for prog_executor_id in self._get_program_executors_ids(**kwargs):
                executor = UserProfile.objects.get(user__id=prog_executor_id)
                order.program_executors.add(executor)

            order.additional_services_executors.clear()
            for item in self._get_services_to_executors(**kwargs):
                for ex in item.get('executors'):
                    executor_id = ex.get('id')
                    if executor_id and item.get('service_id'):
                        order_serv_obj = OrderServiceExecutors.objects.create(
                            **{
                                'executor_id': executor_id,
                                'additional_service_id': item.get('service_id')
                            })
                        order.additional_services_executors.add(order_serv_obj)
                        order.save()

                        # order.additional_services.clear()
                        # for service_id in self._get_additional_services(**kwargs):
                        #     serv = AdditionalService.objects.get(id=service_id)
                        #     order.additional_services.add(serv)

        except self.model.DoesNotExist:
            order = self.create(**kwargs)

        return order

    def count_orders_for_period(self, start, end):
        start = datetime.strptime(start, '%Y-%m-%d %H:%M')
        end = datetime.strptime(end, '%Y-%m-%d %H:%M')
        return self.filter(celebrate_date__range=[start, end]).count()

    def total_orders_price_for_period(self, start, end):
        start = datetime.strptime(start, '%Y-%m-%d %H:%M')
        end = datetime.strptime(end, '%Y-%m-%d %H:%M')
        total_prices = self.filter(
            celebrate_date__range=[start, end]
        ).aggregate(tp=Sum('total_price_with_discounts'))
        return total_prices.get('tp')

    def sources_statistic_for_last_months(self, num_month=6):
        month_names = ('Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                       'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь',
                       'Декабрь')

        def calc_month(idx, current_month_id):
            month_id = current_month_id - idx
            while month_id < 1:
                month_id += 12
            return month_id, month_names[month_id - 1]

        today_month = date.today().month
        res = []
        for i in range(num_month):
            month_num, month_name = calc_month(i, today_month)
            db_res = self.filter(
                celebrate_date__month=month_num
            ).values('where_was_found').annotate(count=Count('pk')).distinct()
            res.append({'month': month_name, 'stats': db_res})
        return res
