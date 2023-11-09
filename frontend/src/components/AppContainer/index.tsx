import React, { useEffect, useRef } from 'react';
import Navbar from '../navbar';
import { Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { AuthState, ExchangeCodeRequest, LoadState, Role } from '../../types';
import { getConfigAsync } from '../../reducers/ConfigSlice';
import { ColorRing } from 'react-loader-spinner';
import {
	CognitoUserPool,
	CognitoUser,
    CognitoUserSession,
    CognitoIdToken,
    CognitoAccessToken,
    CognitoRefreshToken,
} from 'amazon-cognito-identity-js';
import { exchangeCodeForTokenAsync, updateUserFromCachedSession, setAuthState } from '../../reducers/SessionSlice';
import { getCognitoHostedUIDomain, getSubdomain } from '../../utils';
import Masquerade from '../Masquerade';
import { resetReviewsState } from '../../reducers/ReviewsSlice';
import { resetCompensationState } from '../../reducers/CompensationSlice';
import { resetScoresState } from '../../reducers/ScoresSlice';
import { setCurrentUser } from '../../reducers/UsersSlice';
import Banner from '../Banner';
import Cookies from 'js-cookie';

export default function AppContainer() {
    const dispatch = useAppDispatch();
    const location = useLocation();
    const authCode = new URLSearchParams(location.search).get('code');
    const {configState, sessionState, usersState} = useAppSelector((state) => state);
    
    const userPoolRef = useRef<CognitoUserPool>();
    const userRef = useRef<CognitoUser>();

    useEffect(() => {
        if (configState.loadState === LoadState.INIT) {
            let subdomain = getSubdomain(window.location.href);
            dispatch(getConfigAsync(subdomain));
        } else if (configState.loadState === LoadState.LOADED) {
            const poolData = {
                UserPoolId: configState.config?.userPoolId || '',
                ClientId: configState.config?.userPoolClientId || '',
            }
            userPoolRef.current = new CognitoUserPool(poolData);
            loadSession();   
        }
    }, [configState.loadState, dispatch, configState.config?.userPoolId, configState.config?.userPoolClientId]);

    useEffect(() => {
        if (sessionState.loadState === LoadState.LOADED) {
            // This happens after the sign in flow (vs using existing session flow)
            const IdToken = new CognitoIdToken({IdToken: sessionState.user.idToken || ''});
            const AccessToken = new CognitoAccessToken({AccessToken: sessionState.user.accessToken || ''});
            const RefreshToken = new CognitoRefreshToken({RefreshToken: ''})
            const session = new CognitoUserSession({IdToken, AccessToken, RefreshToken});
            
            userRef.current = new CognitoUser({Username: sessionState.user.username || '', Pool: userPoolRef.current!});
            userRef.current.setSignInUserSession(session);
        }
    }, [sessionState.loadState]);

    useEffect(() => {
        dispatch(setCurrentUser(sessionState.user));
    }, [sessionState.user])

    useEffect(() => {
        const cu = sessionState.masqueradeUserId ? 
            usersState.users.find(user => user.id === sessionState.masqueradeUserId) || sessionState.user
            : sessionState.user;
        dispatch(setCurrentUser(cu));
    }, [sessionState.masqueradeUserId, usersState.users])
    

    useEffect(() => {
        if (sessionState.authState === AuthState.UNAUTHENTICATED) {
            console.log('user unauth, redirecting')
            if (userRef.current) {
                userRef.current.signOut(() => {
                    const userPoolClientId = configState.config?.userPoolClientId
                    window.location.href = `${getCognitoHostedUIDomain(window.location.href)}/login?client_id=${userPoolClientId}&response_type=code&scope=aws.cognito.signin.user.admin+email+openid+phone+profile&redirect_uri=${getRedirectUri()}`;
                })
                // userRef.current.globalSignOut({onSuccess: (msg: string) => {
                //     const userPoolClientId = configState.config?.userPoolClientId
                //     window.location.href = `https://pagopeople.auth.us-west-2.amazoncognito.com/login?client_id=${userPoolClientId}&response_type=code&scope=aws.cognito.signin.user.admin+email+openid+phone+profile&redirect_uri=${getRedirectUri()}`;
                // },
                // onFailure: (err: Error) => {
                //     console.log("error signing out", err)

                // }});
            } else {
                const userPoolClientId = configState.config?.userPoolClientId
                window.location.href = `${getCognitoHostedUIDomain(window.location.href)}/login?client_id=${userPoolClientId}&response_type=code&scope=aws.cognito.signin.user.admin+email+openid+phone+profile&redirect_uri=${getRedirectUri()}`;
            }
        }
    }, [sessionState.authState])

    useEffect(() => {
        if (sessionState.masqueradeLoadState === LoadState.LOADED) {
            dispatch(resetReviewsState());
            dispatch(resetCompensationState());
            dispatch(resetScoresState());
        }
    }, [sessionState.masqueradeLoadState])

    useEffect(() => {
        Cookies.remove("masquerade_user_id");
    }, [])

    const loadSession = () => {
        if (userPoolRef.current === undefined) {
            console.error("UserPool undefined");
            return;
        }

        const user = userPoolRef.current.getCurrentUser();
        
        if ( user !== null) {
            user.getSession((err: Error | null, session: CognitoUserSession) => {
                if (err === null) {
                    dispatch(updateUserFromCachedSession(session))
                } else {
                    console.log("Error getting session", err);
                    user.signOut();
                    dispatch(setAuthState(AuthState.UNAUTHENTICATED))
                }
            });
            return;
            
        } 

        if (authCode) {
            // If user is null and we have auth code then we likely arrived here after being redirected
            // from the sign in hosted UI. Need to exchange code for tokens.
            console.log("user is null and we have auth code, need to exchange", authCode)
            const exchangeRequest: ExchangeCodeRequest = {
                clientId: configState.config?.userPoolClientId || '',
                code: authCode,
                redirectUrl: getRedirectUri(),
            }
            dispatch(exchangeCodeForTokenAsync(exchangeRequest))
        } else {
            console.log("No user and no auth code. Need to send them to sign in page")
            dispatch(setAuthState(AuthState.UNAUTHENTICATED));
        }
    }

    const getRedirectUri = () => {
        return window.location.origin + "/";
    }

    const showContent = () => 
        configState.loadState === LoadState.LOADED && sessionState.authState === AuthState.AUTHENTICATED

    const shouldShowMasquerade = () => 
        showContent() && (sessionState.user.role === Role.Admin || sessionState.user.role === Role.SystemAdmin);
    
    const shouldShowMasqueradingBanner = () => shouldShowMasquerade() && sessionState.masqueradeUserId && 
    sessionState.masqueradeUserId !== sessionState.user.id;

    const getMasqueradingMessage = () => "Masquerading"
    return (
        <>
            {shouldShowMasqueradingBanner() && <Banner message={getMasqueradingMessage()} />}
            {showContent() && <Navbar /> }
            <ColorRing
                visible={configState.loadState === LoadState.LOADING }
                height="80"
                width="80"
                ariaLabel="blocks-loading"
                wrapperStyle={{}}
                wrapperClass="blocks-wrapper"
                colors={['#e15b64', '#f47e60', '#f8b26a', '#abbd81', '#849b87']}
            />

            { showContent() && <Outlet /> }
            { shouldShowMasquerade() && <Masquerade />}
            { configState.loadState === LoadState.ERROR && <p>Tenant not found</p>}
        </>
    )


        //     var cognitoUser = userPool.getCurrentUser();

    // if (cognitoUser != null) {
    //     cognitoUser.getSession(function(err, result) {
    //         if (result) {
    //             console.log('You are now logged in.');

    //             //POTENTIAL: Region needs to be set if not already set previously elsewhere.
    //             AWS.config.region = '<region>';

    //             // Add the User's Id Token to the Cognito credentials login map.
    //             AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    //                 IdentityPoolId: 'YOUR_IDENTITY_POOL_ID',
    //                 Logins: {
    //                     'cognito-idp.<region>.amazonaws.com/<YOUR_USER_POOL_ID>': result
    //                         .getIdToken()
    //                         .getJwtToken(),
    //                 },
    //             });
    //         }
    //     });
    // }
    // //call refresh method in order to authenticate user and get new temp credentials
    // AWS.config.credentials.refresh(error => {
    //     if (error) {
    //         console.error(error);
    //     } else {
    //         console.log('Successfully logged!');
    //     }
    // });
};