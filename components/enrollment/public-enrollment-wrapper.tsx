'use client';

import { useState } from 'react';
import { ITSValidation } from './its-validation';
import { EnrollmentInterface } from './enrollment-interface';

export function PublicEnrollmentWrapper() {
    const [validatedUser, setValidatedUser] = useState<any>(null);

    if (validatedUser) {
        return <EnrollmentInterface user={validatedUser} />;
    }

    return <ITSValidation onValidated={setValidatedUser} />;
}
