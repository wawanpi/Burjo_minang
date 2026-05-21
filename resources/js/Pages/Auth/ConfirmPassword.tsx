import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />

            <div className="mb-4 text-sm text-gray-600">
                This is a secure area of the application. Please confirm your
                password before continuing.
            </div>

            <form onSubmit={submit}>
                <Input
                    label="Password"
                    id="password"
                    type="password"
                    name="password"
                    value={data.password}
                    autoFocus
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                />

                <div className="mt-4 flex items-center justify-end">
                    <Button disabled={processing} type="submit">
                        Confirm
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
