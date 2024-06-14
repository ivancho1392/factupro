import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute } from 'amazon-cognito-identity-js';

// Reemplaza estos valores con los de tu User Pool
const poolData = {
  UserPoolId: process.env.USER_POOL_ID || 'us-east-1_TCG58RR5U',
  ClientId: process.env.CLIENT_ID || '5t043hsh449dc84u15076fvgbo',      
};

const userPool = new CognitoUserPool(poolData);

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