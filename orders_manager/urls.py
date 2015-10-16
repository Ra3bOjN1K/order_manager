# -*- coding: utf-8 -*-

from django.conf.urls import url
from django.views.generic import RedirectView

from orders_manager import views


urlpatterns = [
    url(r'^$', RedirectView.as_view(
        pattern_name='orders_manager:orders_list', permanent=True)),
]

actions_under_users_patterns = [
    url(r'^login/$', views.LoginFormView.as_view(), name='login'),
    url(r'^logout/$', views.LogoutFormView.as_view(), name='logout'),
    url(r'^change_pwd/$', views.ChangePasswordFormView.as_view(),
        name='change_password'),
    url(r'^users/$', views.UsersListView.as_view(), name='profiles_list'),
    url(r'^profile/$', views.ShowMyProfileFormView.as_view(),
        name='my_profile'),
    url(r'^user/(?P<username>[\w\.]+)/show/$',
        views.ShowUserProfileFormView.as_view(), name='user_profile'),
    url(r'^user/(?P<username>[\w\.]+)/edit/$', views.EditUserFormView.as_view(),
        name='edit_user'),
    url(r'^user/(?P<username>[\w\.]+)/delete/$', views.DeleteUserView.as_view(),
        name='delete_user'),
    url(r'^users/create/manager/$', views.CreateUserFormView.as_view(),
        name='create_manager'),
    url(r'^users/create/animator/$', views.CreateUserFormView.as_view(),
        name='create_animator'),
    url(r'^users/create/photographer/$', views.CreateUserFormView.as_view(),
        name='create_photographer'),
]

handbooks_patterns = [
    url(r'^handbooks/$', RedirectView.as_view(
        pattern_name='orders_manager:programs_handbook', permanent=False),
        name='handbooks_list'),
]

handbook_programs_patterns = [
    url(r'^handbooks/programs/$', views.ShowProgramsHandbookView.as_view(),
        name='programs_handbook'),
    url(r'^handbooks/program/create/$', views.CreateProgramFormView.as_view(),
        name='create_program'),
    url(r'^handbooks/program/(?P<id>[0-9]+)/edit/$',
        views.EditProgramFormView.as_view(), name='edit_program'),
    url(r'^handbooks/program/(?P<id>[0-9]+)/delete/$',
        views.DeleteProgramView.as_view(), name='delete_program'),
    url(r'^handbooks/program/price/create/$',
        views.CreateProgramPriceView.as_view(), name='create_program_price'),
    url(r'^handbooks/program/price/delete/$',
        views.DeleteProgramPriceView.as_view(), name='delete_program_price'),
    url(r'^handbooks/program/(?P<program_id>[0-9]+)/prices/$',
        views.ShowProgramPricesView.as_view(), name='program_prices'),
    url(r'^handbooks/additional_services/$',
        views.ShowAdditionalServicesHandbookView.as_view(),
        name='additional_services_handbook'),
    url(r'^handbooks/executors/$',
        views.ShowExecutorsHandbookView.as_view(),
        name='executors_handbook'),
    url(r'^handbooks/discounts/$', views.ShowDiscountsHandbookView.as_view(),
        name='discounts_handbook'),
]

orders_patterns = [
    url(r'^orders/$', views.ShowAllOrdersListView.as_view(),
        name='orders_list'),
    url(r'^client/simple_create/$', views.SimpleCreateClientView.as_view(),
        name='simple_create_client'),
    url(r'^order/create/$', views.CreateOrderView.as_view(),
        name='create_order'),
    url(r'^customers/$', views.ShowClientsView.as_view(),
        name='customers_list'),
    url(r'^customers/search/$',
        views.SearchClientsView.as_view(), name='search_customers'),
    url(r'^customer/(?P<id>[\w]+)/children/$',
        views.ClientChildrenView.as_view(), name='client_children_field'),
    url(r'^program/(?P<id>[\w]+)/info/$',
        views.ProgramInfoView.as_view(), name='program_info_view'),
]


urlpatterns.extend(actions_under_users_patterns)
urlpatterns.extend(handbooks_patterns)
urlpatterns.extend(handbook_programs_patterns)
urlpatterns.extend(orders_patterns)
