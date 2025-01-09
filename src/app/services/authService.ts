import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute } from 'amazon-cognito-identity-js';
import { jwtDecode } from 'jwt-decode';

interface DecodedIdToken {
  email?: string;
  'cognito:username'?: string;
  'cognito:groups'?: string[];
}

// Reemplaza estos valores con los de tu User Pool
const poolData = {
  UserPoolId: process.env.USER_POOL_ID || 'us-east-1_TCG58RR5U',
  ClientId: process.env.CLIENT_ID,      
};

const userPool = new CognitoUserPool(poolData);

export const getCurrentUser = () => {
  return userPool.getCurrentUser();
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
  return new Promise((resolve, reject) => {
    const user = getCurrentUser();
    if (user) {
      user.signOut();
      resolve();
    } else {
      resolve();
    }
  });
};
