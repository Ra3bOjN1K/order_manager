from django.core.urlresolvers import reverse
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect, Http404
from django.views.generic import ListView, View
from django.views.generic.edit import FormView
from django.contrib.auth import login, logout
from django.contrib.auth.forms import AuthenticationForm

from orders_manager.forms import UserPasswordChangeForm, \
    UpdateUserProfileForm, ShowUserProfileForm, CreateUserProfileForm
from orders_manager.models import Order, UserProfile

from rolepermissions.mixins import HasPermissionsMixin


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


class ChangePasswordFormView(FormView):
    form_class = UserPasswordChangeForm
    template_name = 'orders_manager/authorization/change_password.html'
    success_url = '/login/'

    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated():
            raise Http404()
        return super(ChangePasswordFormView, self).get(request, *args, **kwargs)

    def get_form_kwargs(self):
        kwargs = super(ChangePasswordFormView, self).get_form_kwargs()
        kwargs.update({
            'user': self.request.user
        })
        return kwargs

    def form_valid(self, form):
        if form.is_valid():
            form.save()
        return super(ChangePasswordFormView, self).form_valid(form)


class LogoutFormView(View):
    def get(self, request):
        if not request.user.is_authenticated():
            raise Http404()
        logout(request)
        return HttpResponseRedirect("/")


class UsersListView(HasPermissionsMixin, ListView):
    model = UserProfile
    template_name = 'orders_manager/user_list.html'
    required_permission = 'see_all_profiles'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(UsersListView, self).dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super(UsersListView, self).get_context_data(**kwargs)
        context['managers'] = UserProfile.objects.all_managers()
        context['animators'] = UserProfile.objects.all_animators()
        context['photographers'] = UserProfile.objects.all_photographers()
        return context


class CreateUserFormView(HasPermissionsMixin, FormView):
    form_class = CreateUserProfileForm
    template_name = 'orders_manager/create_user_profile.html'
    required_permission = 'add_user'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(CreateUserFormView, self).dispatch(request, *args,
                                                        **kwargs)

    def get_form_kwargs(self):
        kwargs = super(CreateUserFormView, self).get_form_kwargs()
        user_role = list(filter(None, self.request.path.split('/')))[-1]
        kwargs['user_role'] = user_role
        return kwargs

    def get_success_url(self):
        return reverse('orders_manager:profiles_list')

    def form_valid(self, form):
        if form.is_valid:
            form.save()
        return super(CreateUserFormView, self).form_valid(form)


class ShowUserProfileFormView(HasPermissionsMixin, FormView):
    form_class = ShowUserProfileForm
    template_name = 'orders_manager/user_profile.html'
    required_permission = 'see_profile_details'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(ShowUserProfileFormView, self).dispatch(request, *args,
                                                             **kwargs)

    def get_form_kwargs(self):
        kwargs = super(ShowUserProfileFormView, self).get_form_kwargs()
        if self.kwargs.get('username'):
            kwargs['user'] = UserProfile.objects.get(
                user__username=self.kwargs.get('username'))
        else:
            raise Http404()
        return kwargs

    def get_success_url(self):
        return reverse('orders_manager:profiles_list')


class ShowMyProfileFormView(FormView):
    form_class = ShowUserProfileForm
    template_name = 'orders_manager/user_profile.html'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        if self.request.user.is_superuser:
            raise Http404()
        return super(ShowMyProfileFormView, self).dispatch(request, *args,
                                                           **kwargs)

    def get_form_kwargs(self):
        kwargs = super(ShowMyProfileFormView, self).get_form_kwargs()
        kwargs['user'] = self.request.user.profile
        return kwargs

    def get_success_url(self):
        return reverse('orders_manager:profiles_list')


class EditUserFormView(HasPermissionsMixin, FormView):
    form_class = UpdateUserProfileForm
    template_name = 'orders_manager/edit_user_profile.html'
    required_permission = 'change_user'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(EditUserFormView, self).dispatch(request, *args, **kwargs)

    def get_form_kwargs(self):
        kwargs = super(EditUserFormView, self).get_form_kwargs()
        if self.kwargs.get('username'):
            kwargs['user'] = UserProfile.objects.get(
                user__username=self.kwargs.get('username'))
        return kwargs

    def get_success_url(self):
        return reverse('orders_manager:profiles_list')

    def form_valid(self, form):
        if form.is_valid:
            form.save()
        return super(EditUserFormView, self).form_valid(form)


class DeleteUserView(HasPermissionsMixin, View):
    required_permission = 'delete_user'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(DeleteUserView, self).dispatch(request, *args, **kwargs)

    def get(self, request, **kwargs):
        username = kwargs.get('username')
        if username:
            profile = UserProfile.objects.get(user__username=username)
            profile.make_inactive()
            return HttpResponseRedirect(reverse("orders_manager:profiles_list"))
        else:
            raise AttributeError('Can\'t delete user. Username not found!')


class ShowHandbooksView(View):
    pass


class ShowAllOrdersListView(ListView):
    model = Order
    template_name = 'orders_manager/order_list.html'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(ShowAllOrdersListView, self).dispatch(request, *args,
                                                           **kwargs)
