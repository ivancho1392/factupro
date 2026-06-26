import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute } from 'amazon-cognito-identity-js';
import { jwtDecode } from 'jwt-decode';

interface DecodedIdToken {
  email?: string;
  'cognito:username'?: string;
  'cognito:groups'?: string[];
}

const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

if (!userPoolId || !clientId) {
  throw new Error('Missing Cognito environment variables');
}

const poolData = {
  UserPoolId: userPoolId,
  ClientId: clientId,
};

const userPool = new CognitoUserPool(poolData);

const isAuthDebugEnabled = process.env.NEXT_PUBLIC_AUTH_DEBUG === 'true';

const maskEmail = (email: string) => {
  const [localPart, domain] = email.split('@');

  if (!localPart || !domain) {
    return 'correo no válido';
  }

  const visibleStart = localPart.slice(0, 2);
  return `${visibleStart}${'*'.repeat(Math.max(localPart.length - 2, 1))}@${domain}`;
};

const authDebug = (message: string, details?: Record<string, string>) => {
  if (!isAuthDebugEnabled) {
    return;
  }

  if (details) {
    console.info('[auth-debug]', message, details);
    return;
  }

  console.info('[auth-debug]', message);
};

const getAuthErrorName = (error: unknown) => {
  if (error && typeof error === 'object') {
    const authError = error as { code?: string; name?: string };
    return authError.code || authError.name || '';
  }

  return '';
};

const getAuthErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object') {
    const authError = error as { message?: string };
    return authError.message || '';
  }

  return '';
};

const getForgotPasswordErrorMessage = (error: unknown) => {
  const errorName = getAuthErrorName(error);
  const errorMessage = getAuthErrorMessage(error);

  switch (errorName) {
    case 'UserNotFoundException':
      return 'No encontramos una cuenta registrada con ese correo.';
    case 'InvalidParameterException':
      return 'El correo ingresado no es válido o la cuenta aún no está confirmada.';
    case 'LimitExceededException':
      return 'Se realizaron demasiados intentos. Intenta nuevamente más tarde.';
    case 'NotAuthorizedException':
      if (errorMessage.includes('Contact administrator to reset password')) {
        return 'La recuperación automática de contraseña no está habilitada para esta cuenta. Contacta al administrador.';
      }

      return 'No pudimos iniciar la recuperación de contraseña. Contacta al administrador.';
    default:
      return 'No pudimos enviar el código de recuperación. Intenta nuevamente.';
  }
};

const getConfirmForgotPasswordErrorMessage = (error: unknown) => {
  const errorName = getAuthErrorName(error);

  switch (errorName) {
    case 'CodeMismatchException':
      return 'El código ingresado no es correcto.';
    case 'ExpiredCodeException':
      return 'El código expiró. Solicita uno nuevo.';
    case 'InvalidPasswordException':
      return 'La nueva contraseña no cumple la política de seguridad.';
    case 'LimitExceededException':
      return 'Se realizaron demasiados intentos. Intenta nuevamente más tarde.';
    case 'UserNotFoundException':
      return 'No encontramos una cuenta registrada con ese correo.';
    default:
      return 'No pudimos cambiar la contraseña. Intenta nuevamente.';
  }
};

export const getCurrentUser = () => {
  return userPool.getCurrentUser();
};

export const validatePasswordPolicy = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('La contraseña debe tener al menos 12 caracteres.');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe incluir al menos una letra mayúscula.');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe incluir al menos una letra minúscula.');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe incluir al menos un número.');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('La contraseña debe incluir al menos un símbolo.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const changePassword = (currentPassword: string, newPassword: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      reject(new Error('No hay una sesión activa.'));
      return;
    }

    cognitoUser.getSession((sessionError: Error | null, session: { isValid: () => boolean } | null) => {
      if (sessionError || !session?.isValid()) {
        reject(new Error('La sesión no es válida. Inicia sesión nuevamente.'));
        return;
      }

      cognitoUser.changePassword(currentPassword, newPassword, (changeError) => {
        if (changeError) {
          reject(new Error('No se pudo cambiar la contraseña. Verifica la contraseña actual e intenta nuevamente.'));
          return;
        }

        resolve();
      });
    });
  });
};

export const forgotPassword = (email: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      reject(new Error('Ingresa tu correo electrónico.'));
      return;
    }

    authDebug('inicio de forgotPassword', { email: maskEmail(trimmedEmail) });

    const cognitoUser = new CognitoUser({
      Username: trimmedEmail,
      Pool: userPool,
    });

    let settled = false;

    cognitoUser.forgotPassword({
      onSuccess: () => {
        if (settled) {
          return;
        }

        settled = true;
        authDebug('código solicitado correctamente', { email: maskEmail(trimmedEmail) });
        resolve();
      },
      onFailure: (error) => {
        if (settled) {
          return;
        }

        settled = true;
        const message = getForgotPasswordErrorMessage(error);
        authDebug('error sanitizado en forgotPassword', {
          email: maskEmail(trimmedEmail),
          error: message,
        });
        reject(new Error(message));
      },
      inputVerificationCode: () => {
        if (settled) {
          return;
        }

        settled = true;
        authDebug('código solicitado correctamente', { email: maskEmail(trimmedEmail) });
        resolve();
      },
    });
  });
};

export const confirmForgotPassword = (email: string, code: string, newPassword: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const trimmedEmail = email.trim();
    const trimmedCode = code.trim();

    if (!trimmedEmail) {
      reject(new Error('Ingresa tu correo electrónico.'));
      return;
    }

    if (!trimmedCode) {
      reject(new Error('Ingresa el código de verificación.'));
      return;
    }

    if (!newPassword) {
      reject(new Error('Ingresa una nueva contraseña.'));
      return;
    }

    authDebug('inicio de confirmForgotPassword', { email: maskEmail(trimmedEmail) });

    const cognitoUser = new CognitoUser({
      Username: trimmedEmail,
      Pool: userPool,
    });

    cognitoUser.confirmPassword(trimmedCode, newPassword, {
      onSuccess: () => {
        authDebug('confirmación exitosa', { email: maskEmail(trimmedEmail) });
        resolve();
      },
      onFailure: (error) => {
        const message = getConfirmForgotPasswordErrorMessage(error);
        authDebug('error sanitizado en confirmForgotPassword', {
          email: maskEmail(trimmedEmail),
          error: message,
        });
        reject(new Error(message));
      },
    });
  });
};

export const login = (email: string, password: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const userData = {
      Username: email,
      Pool: userPool,
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        const idToken = result.getIdToken().getJwtToken();
        const accessToken = result.getAccessToken().getJwtToken();
        const refreshToken = result.getRefreshToken().getToken();

        resolve({
          idToken,
          accessToken,
          refreshToken
      });
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
};

export const signUp = (email: string, password: string, name?: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const attributeList: CognitoUserAttribute[] = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
    ];
    if (name) {
      attributeList.push(new CognitoUserAttribute({ Name: 'name', Value: name }));
    } 

    userPool.signUp(email, password, attributeList, [], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

export const confirmSignUp = (email: string, verificationCode: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const userData = {
      Username: email,
      Pool: userPool,
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.confirmRegistration(verificationCode, true, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

export const getDecodedIdToken = (): Promise<DecodedIdToken> => {
  const user = getCurrentUser();
  if (user) {
    return new Promise((resolve, reject) => {
      user.getSession((err: any, session: any) => {
        if (err) {
          reject(err);
        } else if (session.isValid()) {
          const idToken = session.getIdToken().getJwtToken();
          const decodedToken = jwtDecode<DecodedIdToken>(idToken);
          resolve(decodedToken);
        } else {
          reject('Session is invalid');
        }
      });
    });
  } else {
    return Promise.reject('No current user');
  }
};


export const getUserRoles = (): Promise<string[]> => {
  return getDecodedIdToken()
    .then((decodedToken: DecodedIdToken) => {
      return decodedToken['cognito:groups'] || [];
    });
};

export const logout = (): Promise<void> => {
  return new Promise((resolve) => {
    const user = getCurrentUser();

    if (user) {
      user.signOut();
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem("idToken");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }

    resolve();
  });
};
