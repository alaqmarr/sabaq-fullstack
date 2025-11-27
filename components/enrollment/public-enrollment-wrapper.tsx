'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ITSValidation } from './its-validation';
import { EnrollmentInterface } from './enrollment-interface';

export function PublicEnrollmentWrapper() {
    const [validatedUser, setValidatedUser] = useState<any>(null);
    const searchParams = useSearchParams();
    const initialIts = searchParams.get('its');

    if (validatedUser) {
        return <EnrollmentInterface user={validatedUser} />;
    }

    return <ITSValidation onValidated={setValidatedUser} initialIts={initialIts || undefined} />;
}
