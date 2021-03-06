# -*- coding: utf-8 -*-

from django.shortcuts import render_to_response
from django.core.exceptions import PermissionDenied
from django.template.context_processors import csrf
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from django.http import (HttpResponseRedirect, Http404, HttpResponse)
from django.views.generic import View, TemplateView
from django.views.generic.edit import FormView
from django.contrib.auth import login, logout
from django.contrib.auth.forms import AuthenticationForm
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.generics import (ListAPIView, RetrieveUpdateDestroyAPIView,
    RetrieveAPIView, ListCreateAPIView, CreateAPIView)
from rest_framework.response import Response
from guardian.mixins import PermissionRequiredMixin

from orders_manager.excel_export_service import OrderExcelExporter
from orders_manager.models import (UserProfile, Client, Order, ClientChild,
    Program, ProgramPrice, AdditionalService, Discount, User, DayOff,
    AnimatorDebt, SmsDeliveryEvent, SmsDeliveryMessage)
from orders_manager.serializers import (UserProfileSerializer, ClientSerializer,
    OrderSerializer, ClientChildrenSerializer, ProgramSerializer,
    ProgramPriceSerializer, AdditionalServiceSerializer, DiscountSerializer,
    DayOffSerializer, AnimatorDebtSerializer, SmsDeliveryEventListSerializer,
    SmsDeliveryMessageListSerializer, SmsDeliveryEventSerializer)
from orders_manager.roles import get_user_role
from orders_manager.google_apis import GoogleApiHandler
from orders_manager.sms_delivery_service import SmsDeliveryService
from orders_manager.tasks import (send_order_to_users_google_calendar,
    delete_order_from_users_google_calendar, send_sms_messages_bulk,
    sync_month_orders_to_google_calendar)
from orders_manager.utils.browser_detector import is_mobile_browser


class PopulateDatabaseView(View):
    def get(self, request, *args, **kwargs):
        from orders_manager.utils.generate_data_helper import populate_database
        from orders_manager.roles import init_roles

        init_roles()
        User.objects.create_superuser('admin', 'zakaz.tilibom@gmail.com',
                                      '12345')
        Discount.objects.create(name='Нет скидки', value=0)
        populate_database()

        return HttpResponse('Done')


class CeleryTestManipulationsView(View):
    def get(self, request, *args, **kwargs):
        return HttpResponse({})


def robots(request):
    return render_to_response(template_name='robots.txt',
                              content_type="text/plain")


class OAuthLogin:
    def __init__(self, template_name):
        super(OAuthLogin, self).__init__()
        self.google_oauth = GoogleApiHandler(grant_type='online')
        self.template_name = template_name

    def login(self, code, request):
        credential = self.google_oauth.exchange_auth_code(code)

        if self.is_google_user_valid(credential):
            cred = self.google_oauth.update_user_credentials(credential)
            if cred:
                user = User.objects.get(
                    email=self.google_oauth.get_google_user_email(cred))
                user.backend = 'django.contrib.auth.backends.ModelBackend'
                login(request, user)
                return HttpResponseRedirect('/')
        else:
            return render_to_response(
                template_name=self.template_name,
                context={'error': 'Email не имеет доступа к приложению!'}
            )

    def is_google_user_valid(self, credentials):
        google_user_email = self.google_oauth.get_google_user_email(credentials)
        return self._is_exists_user_with_email(google_user_email)

    def _is_exists_user_with_email(self, email):
        user = UserProfile.objects.filter(user__email=email).first()
        return user is not None and user.user.is_active


class GoogleOauthView(TemplateView):
    template_name = 'orders_manager/authorization/google_oauth.html'

    def __init__(self, **kwargs):
        super(GoogleOauthView, self).__init__(**kwargs)
        self.oauth_login = OAuthLogin(self.template_name)

    def post(self, request, *args, **kwargs):
        code = request.POST.get('auth_code')
        return self.oauth_login.login(code, request)

    def get_context_data(self, **kwargs):
        from django.conf import settings

        kwargs.update({
            'auth_uri': self.oauth_login.google_oauth.get_auth_uri(),
            'is_production_mode': settings.GOOGLE_AUTH_MODE == 'production'
        })
        return kwargs


class GoogleOauthRedirectView(TemplateView):
    template_name = 'orders_manager/authorization/google_oauth.html'

    def __init__(self, **kwargs):
        super(GoogleOauthRedirectView, self).__init__(**kwargs)
        self.google_oauth = OAuthLogin(self.template_name)

    def get(self, request, *args, **kwargs):
        code = request.GET.get('code')
        return self.google_oauth.login(code, request)


class LoginFormView(FormView):
    form_class = AuthenticationForm
    template_name = 'orders_manager/authorization/login.html'
    success_url = '/'

    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated():
            raise Http404()
        return super(LoginFormView, self).get(request, *args, **kwargs)

    def form_valid(self, form):
        self.user = form.get_user()
        login(self.request, self.user)
        return super(LoginFormView, self).form_valid(form)

    def render_to_response(self, context, **response_kwargs):
        context.update(csrf(self.request))
        return super(LoginFormView, self).render_to_response(context,
                                                             **response_kwargs)


class LogoutFormView(View):
    def get(self, request):
        if not request.user.is_authenticated():
            raise Http404()
        logout(request)
        return HttpResponseRedirect("/")


class UserChangePasswordView(CreateAPIView):
    def post(self, request, *args, **kwargs):
        old_pwd = request.data.get('old_password')
        new_pwd = request.data.get('new_password').strip()
        confirm_new_pwd = request.data.get('confirm_new_password')

        errors = []

        if request.user.check_password(old_pwd):
            if new_pwd and confirm_new_pwd:
                if new_pwd == confirm_new_pwd:
                    request.user.set_password(new_pwd)
                    request.user.save()
                    logout(request)
                else:
                    errors.append(
                        {'confirm_new_password': 'Пароли не совпадают'})
            else:
                errors.append({'form': 'Заполнены не все поля'})
        else:
            errors.append({'old_password': 'Введен не верный пароль'})

        return Response({
            'errors': errors
        })


class UserPermissionList(ListAPIView):
    def get(self, request, *args, **kwargs):
        permissions = [x.replace('orders_manager.', '') for x in
                       self.request.user.get_all_permissions() if
                       x.startswith('orders_manager')]
        user_profile = UserProfile.objects.get(user_id=request.user.id)

        return Response([{
            'user': UserProfileSerializer(user_profile).data,
            'permissions': permissions
        }])


class UserListView(ListCreateAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer

    def get_queryset(self):
        from json import loads
        if (self.request.query_params and
                self.request.query_params.get('filters')):
            group_filter = loads(self.request.query_params.get('filters'))
            if group_filter.get('group'):
                if group_filter.get('group') == 'executor':
                    _raise_denied_if_has_no_perm(self.request.user,
                                                 'see_executors')
                    return UserProfile.objects.all_executors()
        else:
            _raise_denied_if_has_no_perm(self.request.user, 'see_all_profiles')

            return UserProfile.objects.all_active().exclude(
                user__groups__name='superuser')

        return super(UserListView, self).get_queryset()

    def post(self, request, *args, **kwargs):
        if request.data.get('mode') == 'delete':
            _raise_denied_if_has_no_perm(self.request.user,
                                         'delete_userprofile')

            user_id = request.data.get('user_id')
            user = UserProfile.objects.get(user_id=user_id)
            user.deactivate()

            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            user_id = request.data.get('user')
            username = request.data.get('username')
            first_name = request.data.get('first_name')
            last_name = request.data.get('last_name')
            email = request.data.get('email')
            phone = request.data.get('phone')
            address = request.data.get('address')
            role = request.data.get('role')

            user_data = {
                'user_id': user_id,
                'username': username,
                'first_name': first_name,
                'last_name': last_name,
                'email': email,
                'phone': phone,
                'address': address,
                'role': role
            }

            if user_id:
                _raise_denied_if_has_no_perm(self.request.user,
                                             'change_userprofile')
                instance = UserProfile.objects.update(**user_data)
            else:
                _raise_denied_if_has_no_perm(self.request.user,
                                             'add_userprofile')

                user_role = user_data.get('role')

                if len(UserProfile.objects.filter(
                        user__email=user_data.get('email')).all()) > 0:
                    raise ValueError('User with same email already exists..')

                if user_role == 'manager':
                    instance = UserProfile.objects.create_manager(**user_data)
                elif user_role == 'animator':
                    instance = UserProfile.objects.create_animator(**user_data)
                elif user_role == 'photographer':
                    instance = UserProfile.objects.create_photographer(
                        **user_data)
                else:
                    raise AttributeError('Role \'%s\' is wrong!' % user_role)

            user_ser = self.get_serializer(instance)
            return Response(user_ser.data)


class ClientListView(ListCreateAPIView):
    queryset = Client.objects.all().order_by('id')
    serializer_class = ClientSerializer

    def get(self, request, *args, **kwargs):
        _raise_denied_if_has_no_perm(self.request.user, 'see_client')
        return super(ClientListView, self).get(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        try:
            if request.data.get('mode') == 'quick_create':
                _raise_denied_if_has_no_perm(self.request.user, 'add_client')

                client = Client.objects.update_or_create(**{
                    'name': request.data.get('name'),
                    'phone': request.data.get('phone'),
                    'phone_2': request.data.get('phone_2')
                })
                ClientChild.objects.update_or_create(**{
                    'client_id': client.id,
                    'name': request.data.get('child_name'),
                    'age': request.data.get('child_age'),
                    'celebrate_date': request.data.get('celebrate_date')
                })
                client_ser = self.get_serializer(client)
                return Response(client_ser.data)

            elif request.data.get('mode') == 'delete':
                _raise_denied_if_has_no_perm(self.request.user, 'delete_client')

                client_id = request.data.get('client_id')
                client = Client.objects.get(id=client_id)
                client_orders = client.order_set.all()
                if client_orders:
                    client.deactivate()
                else:
                    client.delete()
                return Response(status=status.HTTP_200_OK)
            else:
                _raise_denied_if_has_no_perm(self.request.user, 'add_client')

                client = Client.objects.update_or_create(**{
                    'id': request.data.get('id'),
                    'name': request.data.get('name'),
                    'phone': request.data.get('phone'),
                    'phone_2': request.data.get('phone_2'),
                    'email': request.data.get('email'),
                    'vk_link': request.data.get('vk_link'),
                    'odnoklassniki_link': request.data.get('odnoklassniki_link'),
                    'instagram_link': request.data.get('instagram_link'),
                    'facebook_link': request.data.get('facebook_link'),
                    'secondby_link': request.data.get('secondby_link'),
                    'comments': request.data.get('comments'),
                })
                client_ser = self.get_serializer(client)
                return Response(client_ser.data)
        except Exception as ex:
            return Response(
                status=status.HTTP_400_BAD_REQUEST,
                data={'error': ex.args[0]}
            )


class ClientView(RetrieveAPIView):
    def get(self, request, *args, **kwargs):
        _raise_denied_if_has_no_perm(self.request.user, 'see_client_details')

        obj = Client.objects.get(id=kwargs.get('pk'))
        ser_obj = ClientSerializer(obj)
        return Response(ser_obj.data)


class ClientChildrenListView(ListCreateAPIView):
    queryset = ClientChild.objects.all()
    serializer_class = ClientChildrenSerializer

    def list(self, request, *args, **kwargs):
        _raise_denied_if_has_no_perm(self.request.user, 'see_client_children')

        queryset = self.get_queryset().filter(client__id=kwargs.get('pk'))
        serializer = ClientChildrenSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        if request.data.get('mode'):
            action = request.data.pop('mode')
            if action == 'delete':
                _raise_denied_if_has_no_perm(self.request.user,
                                             'delete_clientchild')

                child_id = request.data.get('child_id')
                child = ClientChild.objects.get(id=child_id)
                child_orders = child.order_set.all()

                if child_orders:
                    child.deactivate()
                else:
                    child.delete()

                return Response(status=status.HTTP_204_NO_CONTENT)

        _raise_denied_if_has_no_perm(self.request.user, 'add_clientchild')

        return super(ClientChildrenListView, self).post(request, *args,
                                                        **kwargs)


class OrderView(RetrieveUpdateDestroyAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def delete(self, request, *args, **kwargs):
        delete_order_from_users_google_calendar.apply(args=[kwargs.get('pk')])
        super(OrderView, self).delete(request, *args, **kwargs)

    def get_serializer(self, *args, **kwargs):
        user_role = get_user_role(self.request.user)
        if (user_role not in ('manager', 'superuser') and
                self._is_executors_demo_date(self.get_object())):
            kwargs.update({'required_fields': [
                'id', 'celebrate_date', 'celebrate_time', 'program', 'duration',
                'address', 'celebrate_place', 'executor_comment',
                'additional_services_executors'
            ]})
        return super(OrderView, self).get_serializer(*args, **kwargs)

    def get_object(self):
        _raise_denied_if_has_no_perm(self.request.user, 'see_orders')

        instance = super(OrderView, self).get_object()
        user_role = get_user_role(self.request.user)
        if (user_role not in ('manager', 'superuser') and
                self._is_executors_demo_date(instance)):
            instance.address = self._trim_address(instance.address)
        return instance

    def _is_executors_demo_date(self, order):
        from datetime import date, timedelta
        res = order.celebrate_date > (date.today() + timedelta(days=1))
        return res

    def _trim_address(self, address):
        from json import loads, dumps
        from copy import copy

        address_dict = loads(address)

        for key, value in copy(address_dict).items():
            if key not in ('city', 'street'):
                del address_dict[key]
        return dumps(address_dict)


class OrderListView(ListCreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def post(self, request, *args, **kwargs):
        if request.data.get('action') == 'sync_google_calendar':
            _raise_denied_if_has_no_perm(self.request.user, 'see_orders')
            sync_month_orders_to_google_calendar(self.request.user.id)
            return Response(status=status.HTTP_200_OK, data='all right')

        _raise_denied_if_has_no_perm(self.request.user, 'add_order')

        user_id = (request.user.user.id if hasattr(request.user, 'user') else
                   request.user.id)
        request.data.update(
            {'author': {'id': user_id, 'full_name': ''}})

        latest_executors = set()

        is_new_order = True

        if request.data.get('id'):
            is_new_order = False
            latest_executors.update(
                self._get_all_executors_from_order(request.data['id']))

        response = super(OrderListView, self).post(request, *args, **kwargs)

        if response:
            new_executors = set(self._get_all_executors_from_order(
                response.data['id']))
            diff_executors = list(latest_executors - new_executors)
            send_order_to_users_google_calendar.delay(
                order_id=response.data['id'], is_new_order=is_new_order)
            delete_order_from_users_google_calendar.delay(
                order_id=response.data['id'], target_users=diff_executors)

        return response

    def _get_all_executors_from_order(self, order_id):

        latest_order = Order.objects.get(id=order_id)
        latest_order_executors = set([i.user_id for i in
                                      latest_order.program_executors.all()])
        latest_order_executors.update(
            [i.executor.user_id for i in
             latest_order.additional_services_executors.all()]
        )
        return list(latest_order_executors)

    def get_queryset(self):
        import datetime
        from django.db.models import Q

        _raise_denied_if_has_no_perm(self.request.user, 'see_orders')

        user_role = get_user_role(self.request.user)
        if user_role in ('manager', 'superuser'):
            if self.request.query_params.get('date_range'):
                date_range = self.request.query_params.get('date_range')
                if not date_range == 'None':
                    import json
                    date_range = json.loads(date_range)
                    period = (date_range.get('start'), date_range.get('end'))
                    return Order.objects.get_order_list_for_period(*period)
            return Order.objects.all()
        else:
            return Order.objects.filter(
                (
                    Q(program_executors__user_id=self.request.user.id) |
                    Q(additional_services_executors__executor_id=self.request.user.id)
                )
                & Q(celebrate_date__gte=datetime.date.today())
            ).distinct('id')

    def get_serializer(self, *args, **kwargs):
        user_role = get_user_role(self.request.user)
        if user_role not in ('manager', 'superuser'):
            if not self.request.query_params.get('full_data', False):
                kwargs.update({'required_fields': [
                    'id', 'celebrate_date', 'celebrate_time', 'program',
                    'duration', 'is_only_service_executor'
                ]})
        elif self.request.query_params.get('date_range'):
            if not self.request.query_params.get('full_data'):
                kwargs.update({'required_fields': [
                    'client', 'program', 'celebrate_date']})
        return super(OrderListView, self).get_serializer(*args, **kwargs)


class OrderExecutorCommentView(CreateAPIView):
    def post(self, request, *args, **kwargs):
        order_id = request.data.get('id')
        if order_id:
            order = Order.objects.get(id=order_id)
            order.executor_comment = request.data.get('executor_comment', '')
            order.save()
            serializer = OrderSerializer(order)

            return Response(serializer.data)


class ProgramView(RetrieveUpdateDestroyAPIView):
    def get(self, request, *args, **kwargs):
        _raise_denied_if_has_no_perm(self.request.user, 'see_program_details')

        obj = Program.objects.get(id=kwargs.get('pk'))
        ser_obj = ProgramSerializer(obj)
        return Response(ser_obj.data)


class ProgramListView(ListCreateAPIView):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer

    def list(self, request, *args, **kwargs):
        _raise_denied_if_has_no_perm(self.request.user, 'see_programs')
        return super(ProgramListView, self).list(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        if request.data.get('mode'):
            action = request.data.pop('mode')
            if action == 'delete':
                _raise_denied_if_has_no_perm(self.request.user,
                                             'delete_program')

                program_id = request.data.get('program_id')
                program = Program.objects.get(id=program_id)
                orders = program.order_set.all()

                if orders:
                    program.deactivate()
                else:
                    program.delete()

                return Response(status=status.HTTP_204_NO_CONTENT)

        _raise_denied_if_has_no_perm(self.request.user, 'add_program')

        return super(ProgramListView, self).post(request, *args, **kwargs)


class ProgramPriceListView(ListCreateAPIView):
    serializer_class = ProgramPriceSerializer

    def get_queryset(self):
        _raise_denied_if_has_no_perm(self.request.user, 'see_program_prices')
        return ProgramPrice.objects.filter(
            program__id=self.kwargs.get('pk')).order_by('duration').all()

    def post(self, request, *args, **kwargs):
        if request.data.get('mode'):
            action = request.data.pop('mode')
            if action == 'delete':
                _raise_denied_if_has_no_perm(self.request.user,
                                             'delete_programprice')
                price_id = request.data.get('price_id')
                price = ProgramPrice.objects.get(id=price_id)
                price.delete()

                return Response(status=status.HTTP_204_NO_CONTENT)

        _raise_denied_if_has_no_perm(self.request.user, 'add_programprice')

        return super(ProgramPriceListView, self).post(request, *args, **kwargs)


class AdditionalServicesListView(ListCreateAPIView):
    queryset = AdditionalService.objects.all()
    serializer_class = AdditionalServiceSerializer

    def get(self, request, *args, **kwargs):
        _raise_denied_if_has_no_perm(self.request.user,
                                     'see_additionalservices')
        return super(AdditionalServicesListView, self).get(request, *args,
                                                           **kwargs)

    def post(self, request, *args, **kwargs):
        if request.data.get('mode'):
            action = request.data.pop('mode')
            if action == 'delete':
                addit_serv_id = request.data.get('additional_service_id')
                addit_serv = AdditionalService.objects.get(id=addit_serv_id)
                orders = addit_serv.orders.all()

                if orders:
                    addit_serv.deactivate()
                else:
                    addit_serv.delete()

                return Response(status=status.HTTP_204_NO_CONTENT)

        return super(AdditionalServicesListView, self).post(
            request, *args, **kwargs)


class DayOffListView(ListCreateAPIView):
    serializer_class = DayOffSerializer

    def post(self, request, *args, **kwargs):
        if request.data.get('mode'):
            action = request.data.pop('mode')
            if action == 'delete':
                day_off_id = request.data.get('id')
                day_off = DayOff.objects.get(id=day_off_id)
                day_off.delete()

                return Response(status=status.HTTP_204_NO_CONTENT)

        req_user_id = request.data.get('user_id')

        user_id = request.user.id if not req_user_id else req_user_id

        data = {
            'id': request.data.get('id'),
            'user_id': user_id,
            'date': request.data.get('date'),
            'time_start': request.data.get('time_start'),
            'time_end': request.data.get('time_end')
        }

        day_off = DayOff.objects.update_or_create(**data)
        day_off_ser = DayOffSerializer(day_off)

        return Response(day_off_ser.data, status=status.HTTP_201_CREATED)

    def get_queryset(self):
        from orders_manager.models import get_user_role
        if get_user_role(self.request.user) in ('manager', 'superuser'):
            return DayOff.objects.all()
        else:
            return self.request.user.profile.days_off.all()


class DayOffView(RetrieveAPIView):
    def get(self, request, *args, **kwargs):
        obj = DayOff.objects.get(id=kwargs.get('pk'))
        ser_obj = DayOffSerializer(obj)
        return Response(ser_obj.data)


class DiscountListView(ListCreateAPIView):
    queryset = Discount.objects.all()
    serializer_class = DiscountSerializer

    def get(self, request, *args, **kwargs):
        _raise_denied_if_has_no_perm(self.request.user, 'see_discounts')
        return super(DiscountListView, self).get(request, *args, **kwargs)

    def get_queryset(self):
        res = super(DiscountListView, self).get_queryset().filter(
            is_active=True)
        return sorted(res, key=lambda x: x.value)

    def post(self, request, *args, **kwargs):
        if request.data.get('mode'):
            action = request.data.pop('mode')
            if action == 'delete':
                discount_id = request.data.get('id')
                discount = Discount.objects.get(id=discount_id)
                orders = discount.orders.all()

                if orders:
                    discount.deactivate()
                else:
                    discount.delete()

                return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            discount_id = request.data.get('id')
            name = request.data.get('name')
            value = request.data.get('value')

            if name and value and int(value) > 0:
                if discount_id:
                    instance = Discount.objects.get(id=discount_id)
                    instance.name = name
                    instance.value = value
                    instance.save()
                else:
                    instance = Discount.objects.create(**{
                        'name': name,
                        'value': value
                    })
                discount_ser = self.get_serializer(instance)

                return Response(discount_ser.data)

        return super(DiscountListView, self).post(request, *args, **kwargs)


class ShowAllOrdersListView(PermissionRequiredMixin, TemplateView):
    permission_required = 'orders_manager.see_orders'
    # template_name = 'orders_manager/list_order.html'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        if is_mobile_browser(request):
            pass
        return super(ShowAllOrdersListView, self).dispatch(request, *args,
                                                           **kwargs)

    def get_template_names(self):
        user = self.request.user
        user = user if not hasattr(user, 'user') else user.user
        can_create_order = user.has_perm('orders_manager.add_order')
        if is_mobile_browser(self.request) and can_create_order:
            return 'orders_manager/mobile/index.html'
        else:
            return 'orders_manager/list_order.html'


class AnimatorDebtListView(ListCreateAPIView):
    serializer_class = AnimatorDebtSerializer

    def get(self, request, *args, **kwargs):
        return super(AnimatorDebtListView, self).get(request, *args, **kwargs)

    def get_queryset(self):
        from django.db.models import Q
        filter_param = self.request.query_params.get('filter')
        if filter_param == 'my_only':
            _raise_denied_if_has_no_perm(self.request.user,
                                         'see_program_details')
            return AnimatorDebt.objects.filter(
                Q(paid=False) &
                Q(executor=self.request.user.profile)
            ).all()
        _raise_denied_if_has_no_perm(self.request.user, 'delete_programprice')
        return AnimatorDebt.objects.filter(paid=False).all()

    def post(self, request, *args, **kwargs):
        if request.data:
            action = request.data.get('action')
            if action == 'pay_debt':
                _raise_denied_if_has_no_perm(self.request.user,
                                             'delete_program')
                debt = AnimatorDebt.objects.get(id=request.data.get('debt_id'))
                debt.paid = not debt.paid
                debt.save()
                return Response(status=status.HTTP_200_OK)
        return Response(status=status.HTTP_400_BAD_REQUEST)


class SmsDeliveryView(APIView):
    TARGET_EVENTS = 'events'
    TARGET_MESSAGES = 'messages'

    def get(self, request, *args, **kwargs):
        if request.query_params:
            if request.query_params.get('target'):
                target = request.query_params.get('target')
                if target == self.TARGET_EVENTS:
                    return Response(
                        status=status.HTTP_200_OK,
                        data=self._get_delivery_events_serialized()
                    )
                elif target == self.TARGET_MESSAGES:
                    return Response(
                        status=status.HTTP_200_OK,
                        data=self._get_delivery_messages_serialized()
                    )
        return Response(status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, *args, **kwargs):
        try:
            if request.data:
                target = request.data.get('target')
                if target == 'event':
                    _raise_denied_if_has_no_perm(self.request.user,
                                                 'delete_program')
                    action = request.data.get('action')
                    if action == 'save':
                        event = SmsDeliveryEvent.objects.update_or_create(
                            **request.data.get('data'))
                        d = SmsDeliveryEventSerializer(event)
                        return Response(status=status.HTTP_200_OK, data=d.data)
                    elif action == 'delete':
                        event_id = request.data.get('event_id')
                        SmsDeliveryEvent.objects.get(id=event_id).delete()
                        return Response(status=status.HTTP_200_OK)
                elif target == 'api_settings':
                    sms_service = SmsDeliveryService()
                    action = request.data.get('action')
                    if action == 'get':
                        return Response(
                            status=status.HTTP_200_OK,
                            data=sms_service.get_api_settings()
                        )
                    if action == 'save':
                        settings = request.data.get('settings')
                        sms_service.save_api_settings(
                            login=settings.get('login'),
                            apikey=settings.get('apikey'),
                            sender=settings.get('sender'),
                            transliteration=settings.get('transliteration')
                        )
                        return Response(status=status.HTTP_200_OK)
                action = request.data.get('action')
                if action == 'send':
                    _raise_denied_if_has_no_perm(self.request.user,
                                                 'delete_program')
                    mode = request.data.get('mode')
                    messages = request.data.get('messages')
                    if mode == 'manual' and messages:
                        send_sms_messages_bulk(messages, replace_names=True)
                        return Response(status=status.HTTP_200_OK)
                    elif mode == 'scheduled' and messages:
                        sent_ids = send_sms_messages_bulk(messages)
                        return Response(
                            status=status.HTTP_200_OK,
                            data={
                                'sent': sent_ids
                            }
                        )
                if action == 'update_message_transliteration':
                    from orders_manager.transliterate_service import \
                        transliterate_message, need_transliteration
                    message = request.data.get('message', '')
                    return Response(
                        status=status.HTTP_200_OK,
                        data={
                            'message': (
                                transliterate_message(message)
                                if need_transliteration()
                                else transliterate_message(
                                    message, reverse=False)
                            )
                        }
                    )
                elif action == 'moderated_message':
                    _raise_denied_if_has_no_perm(self.request.user,
                                                 'delete_program')
                    msg_id = request.data.get('message_id')
                    value = request.data.get('value')
                    if msg_id:
                        sms_msg = SmsDeliveryMessage.objects.get(id=msg_id)
                        sms_msg.is_checked = value
                        sms_msg.save()
                        return Response(status=status.HTTP_200_OK)
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as ex:
            return Response(
                status=status.HTTP_400_BAD_REQUEST,
                data={
                    'status': 'error',
                    'message': ex.args[0]
                }
            )

    def _get_delivery_events_serialized(self):
        events = SmsDeliveryEvent.objects.all().order_by('-created')
        return SmsDeliveryEventListSerializer(events).data

    def _get_delivery_messages_serialized(self):
        messages = SmsDeliveryMessage.objects.filter(is_checked=False).all()
        return SmsDeliveryMessageListSerializer(messages).data


class StatisticView(APIView):
    def get(self, request, *args, **kwargs):
        if request.query_params:
            if request.query_params.get('start') and request.query_params.get(
                    'end'):
                period = (
                    request.query_params.get('start'),
                    request.query_params.get('end')
                )
                return Response(
                    status=status.HTTP_200_OK,
                    data={
                        'orders_stats': self._get_orders_statistic(period),
                        'finance_stats': self._get_finance_statistic(period)
                    }
                )
            elif request.query_params.get('type'):
                t = request.query_params.get('type')
                if t == 'order_sources':
                    return Response(
                        status=status.HTTP_200_OK,
                        data={
                            'sources_stats': self._get_order_sources_statistic()
                        }
                    )
        return Response(status=status.HTTP_400_BAD_REQUEST)

    def _get_orders_statistic(self, period):
        prog_to_count = Program.objects.programs_to_orders_count(*period)
        return {
            'all_count': Order.objects.count_orders_for_period(*period),
            'program_to_orders_count': prog_to_count
        }

    def _get_finance_statistic(self, period):
        total = Order.objects.total_orders_price_for_period(*period)
        salary = UserProfile.objects.executors_salary_for_period(*period)
        return {
            'total': total,
            'salary': salary,
            'income': total - sum([s.get('total_salary') for s in salary])
        }

    def _get_order_sources_statistic(self):
        return Order.objects.sources_statistic_for_last_months(num_month=13)


class XmlExportView(APIView):
    def get(self, request, *args, **kwargs):
        _raise_denied_if_has_no_perm(self.request.user, 'delete_userprofile')
        try:
            from django.contrib.staticfiles import finders
            exporter = OrderExcelExporter()
            output = exporter.build_orders_excel_output(Order.objects.all())
            response = HttpResponse(
                output.read(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = "attachment; filename=orders.xlsx"
            return response
        except Exception as ex:
            return Response(
                status=status.HTTP_400_BAD_REQUEST,
                data={
                    'status': 'error',
                    'message': ex.args[0]
                }
            )


def _raise_denied_if_has_no_perm(user, short_perm):
    user = user if not hasattr(user, 'user') else user.user
    if not user.has_perm('orders_manager.%s' % short_perm):
        raise PermissionDenied
