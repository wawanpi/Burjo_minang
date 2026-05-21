import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        no_hp: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <form onSubmit={submit}>
                <Input
                    label="Name"
                    id="name"
                    name="name"
                    value={data.name}
                    autoComplete="name"
                    autoFocus
                    onChange={(e) => setData('name', e.target.value)}
                    error={errors.name}
                    required
                />

                <div className="mt-4">
                    <Input
                        label="Email"
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        error={errors.email}
                        required
                    />
                </div>

                <div className="mt-4">
                    <Input
                        label="Nomor HP"
                        id="no_hp"
                        type="tel"
                        name="no_hp"
                        value={data.no_hp}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9+]/g, '');
                            setData('no_hp', val);
                        }}
                        error={errors.no_hp}
                        placeholder="081234567890"
                        required
                    />
                </div>

                <div className="mt-4">
                    <Input
                        label="Password"
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        error={errors.password}
                        required
                    />
                </div>

                <div className="mt-4">
                    <Input
                        label="Confirm Password"
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        autoComplete="new-password"
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        error={errors.password_confirmation}
                        required
                    />
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <Link
                        href={route('login')}
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Already registered?
                    </Link>

                    <Button className="ms-4" disabled={processing} type="submit">
                        Register
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
