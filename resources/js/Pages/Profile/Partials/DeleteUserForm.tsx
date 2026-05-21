import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import Modal from '@/Components/ui/Modal';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

export default function DeleteUserForm({ className = '' }: { className?: string }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Delete Account
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Once your account is deleted, all of its resources and data
                    will be permanently deleted. Before deleting your account,
                    please download any data or information that you wish to
                    retain.
                </p>
            </header>

            <Button variant="danger" onClick={confirmUserDeletion}>
                Delete Account
            </Button>

            <Modal isOpen={confirmingUserDeletion} title="Confirm Account Deletion" onClose={closeModal}>
                <form onSubmit={deleteUser} className="mt-2">
                    <p className="mt-1 text-sm text-gray-600 mb-6">
                        Once your account is deleted, all of its resources and
                        data will be permanently deleted. Please enter your
                        password to confirm you would like to permanently delete
                        your account.
                    </p>

                    <Input
                        label="Password"
                        id="password"
                        type="password"
                        name="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoFocus
                        placeholder="Password"
                        error={errors.password}
                    />

                    <div className="mt-6 flex justify-end gap-3">
                        <Button variant="ghost" onClick={closeModal} type="button">
                            Cancel
                        </Button>

                        <Button variant="danger" disabled={processing} type="submit">
                            Delete Account
                        </Button>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
