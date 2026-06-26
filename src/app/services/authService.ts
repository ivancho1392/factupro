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
