# -*- coding: utf-8 -*-

from django import forms

from rolepermissions.shortcuts import get_user_role

from orders_manager.models import UserProfile, DAY_MULTIPLE_CHOICES, ROLES
from orders_manager.form_fields import CheckboxToButtonSelectMultiple, \
    RadioButtonToButtonSelect
from orders_manager.roles import set_user_role


class UserPasswordChangeForm(forms.Form):
    _password = forms.CharField(
        widget=forms.PasswordInput(
            attrs={'style': 'display:none'},
        ),
        required=False,
        label='',
    )
    old_password = forms.CharField(widget=forms.PasswordInput(),
                                   label='Старый пароль:')
    new_password = forms.CharField(widget=forms.PasswordInput(),
                                   label='Новый пароль:')
    confirm_password = forms.CharField(widget=forms.PasswordInput(),
                                       label='Подтверждение пароля:')

    def __init__(self, **kwargs):
        self.user = kwargs.pop('user')
        super(UserPasswordChangeForm, self).__init__(**kwargs)

    def clean_old_password(self):
        password = self.cleaned_data.get('old_password')
        if password:
            password = password.strip()
        if not password or not self.user.check_password(password):
            raise forms.ValidationError('Введен неправильный пароль!')
        return password

    def clean_new_password(self):
        return self.cleaned_data.get('new_password')

    def clean_confirm_password(self):
        confirm_pass = self.cleaned_data.get('confirm_password')
        if confirm_pass != self.cleaned_data['new_password']:
            raise forms.ValidationError('Пароли не совпадают!')
        return confirm_pass

    def is_valid(self):
        self.full_clean()
        if self.user and not self.errors:
            return True
        return False

    def save(self):
        self.user.set_password(self.cleaned_data['new_password'])
        self.user.save()


class UserProfileForm(forms.Form):
    username = forms.CharField(required=True, label='Логин:')
    email = forms.CharField(required=True, label='Email:')
    first_name = forms.CharField(required=True, label='Имя:')
    last_name = forms.CharField(required=True, label='Фамилия:')
    phone = forms.CharField(required=True, label='Телефон:')
    address = forms.CharField(
        widget=forms.Textarea(attrs={'style': 'resize:none', 'rows': 6,
                                     'cols': 20}),
        label='Адрес:'
    )
    weekends = forms.MultipleChoiceField(
        choices=DAY_MULTIPLE_CHOICES,
        label="Выходные:",
        required=False,
        widget=CheckboxToButtonSelectMultiple()
    )
    role = forms.ChoiceField(
        choices=ROLES,
        label="Должность:",
        required=True,
        widget=RadioButtonToButtonSelect()
    )

    def _clean_space_symbols(self, field_name):
        field = self.cleaned_data.get(field_name, '')
        field = field.strip()
        if not field:
            raise forms.ValidationError('Обязательное поле.')
        return field

    def clean_username(self):
        return self._clean_space_symbols('username')

    def clean_first_name(self):
        return self._clean_space_symbols('first_name')

    def clean_last_name(self):
        return self._clean_space_symbols('last_name')

    def clean_email(self):
        return self._clean_space_symbols('email')

    def clean_address(self):
        return self._clean_space_symbols('address')

    def clean_phone(self):
        return self._clean_space_symbols('phone')


class ShowUserProfileForm(UserProfileForm):
    role = forms.CharField(label='Должность:')

    def __init__(self, **kwargs):
        self.user = kwargs.pop('user')
        if self.user:
            kwargs['initial'] = self._user_fields_initial(self.user)
        super(ShowUserProfileForm, self).__init__(**kwargs)
        for name, field in self.fields.items():
            field.widget.attrs['readonly'] = True

    def _user_fields_initial(self, user):
        from orders_manager.models import User

        if isinstance(user, User):
            user = user.profile

        return {
            'username': user.get_username(),
            'email': user.get_email(),
            'first_name': user.get_first_name(),
            'last_name': user.get_last_name(),
            'phone': user.get_phone(),
            'address': user.get_address(),
            'weekends': user.get_weekends(),
            'role': user.get_role_name(),
        }


class CreateUserProfileForm(UserProfileForm):
    role = None
    _password = forms.CharField(
        widget=forms.PasswordInput(
            attrs={'style': 'display:none'},
        ),
        required=False,
        label='',
    )

    password = forms.CharField(
        widget=forms.PasswordInput(),
        required=True,
        label='Пароль:',
    )
    confirm_password = forms.CharField(
        widget=forms.PasswordInput(),
        required=True,
        label='Подтверждение пароля:',
    )

    def __init__(self, **kwargs):
        self.user_role = kwargs.pop('user_role')
        super(CreateUserProfileForm, self).__init__(**kwargs)

    def clean_password(self):
        password = self._clean_space_symbols('password')
        return password

    def clean_confirm_password(self):
        password = self.cleaned_data['password']
        confirm_pass = self.cleaned_data.get('confirm_password')
        if not password == confirm_pass:
            raise forms.ValidationError('Пароли не совпадают.')
        return confirm_pass

    def is_valid(self):
        self.full_clean()
        if self.user_role and not self.errors:
            return True
        return False

    def save(self, commit=True):
        user_info = dict(
            username=self.cleaned_data.get('username'),
            first_name=self.cleaned_data.get('first_name'),
            last_name=self.cleaned_data.get('last_name'),
            email=self.cleaned_data.get('email'),
            phone=self.cleaned_data.get('phone'),
            address=self.cleaned_data.get('address'),
            weekends=self.cleaned_data.get('weekends'),
            password=self.cleaned_data.get('password'),
        )

        if self.user_role == 'manager':
            UserProfile.objects.create_manager(**user_info)
        elif self.user_role == 'animator':
            UserProfile.objects.create_animator(**user_info)
        elif self.user_role == 'photographer':
            UserProfile.objects.create_photographer(**user_info)
        else:
            raise AttributeError(
                'User role "%s" doesn\'t exists..' % self.user_role)


class UpdateUserProfileForm(UserProfileForm):
    username = None
    email = None

    def __init__(self, **kwargs):
        self.user = kwargs.pop('user')
        if self.user:
            kwargs['initial'] = self._user_fields_initial(self.user)
        super(UserProfileForm, self).__init__(**kwargs)

    def _user_fields_initial(self, user):
        from orders_manager.models import User

        if isinstance(user, User):
            user = user.profile

        return {
            'first_name': user.get_first_name(),
            'last_name': user.get_last_name(),
            'phone': user.get_phone(),
            'address': user.get_address(),
            'weekends': user.get_weekends(),
            'role': get_user_role(user.user).get_name()
        }

    def is_valid(self):
        self.full_clean()
        if self.user and not self.errors:
            return True
        return False

    def save(self, commit=True):
        if self.user:
            self.user.user.first_name = self.cleaned_data.get('first_name')
            self.user.user.last_name = self.cleaned_data.get('last_name')
            self.user.phone = self.cleaned_data.get('phone')
            self.user.address = self.cleaned_data.get('address')
            set_user_role(self.user, self.cleaned_data.get('role'))
            self.user.set_weekends(self.cleaned_data.get('weekends'))
            self.user.user.save()
            self.user.save()
