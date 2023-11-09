import { Review, Role } from "./types"

const isLocalHost = (url: string) => {
    return url.includes("localhost") || url.includes("127.0.0.1")
}

export const getApiUrl = (href: string) => {
    if (isLocalHost(href)) {
        return `http://localhost:8000`
    }
    const subdomain = getSubdomain(href);
    if (href.includes("staging.pagopeople.com")) {
        return `https://${subdomain}.staging.api.pagopeople.com`;
    }
    if (href.includes("pagopeople.com")) {
        return `https://${subdomain}.api.pagopeople.com`;
    }

    throw new Error(`Unrecognized url ${href}`);
}

export const getSubdomain = (href: string) => {
    if (isLocalHost(href)) {
        return 'testing';
    }
    return href.split(".")[0].replace("http://", "").replace("https://", "");
}

export const getCognitoCodeExchange = (href: string) => {

    if (href.includes("staging.pagopeople.com") || isLocalHost(href)) {
        return `https://stagingpagopeople.auth.us-west-2.amazoncognito.com/oauth2/token`;
    }
    if (href.includes("pagopeople.com")) {
        return `https://pagopeople.auth.us-west-2.amazoncognito.com/oauth2/token`;
    }

    throw new Error(`Unrecognized url ${href}`); 
}

export const getCognitoHostedUIDomain = (href: string) => {

    if (href.includes("staging.pagopeople.com") || isLocalHost(href)) {
        return `https://stagingpagopeople.auth.us-west-2.amazoncognito.com`;
    }
    if (href.includes("pagopeople.com")) {
        return `https://pagopeople.auth.us-west-2.amazoncognito.com`;
    }

    throw new Error(`Unrecognized url ${href}`); 

}

export const getRolesAsList = () => {
    return (Object.keys(Role) as Array<keyof typeof Role>).filter(k => typeof k !== 'number' && k !== 'SystemAdmin') 
}

export const reviewSortFunction = (r1: Review, r2: Review) => {
    const submittedAt1 = r1.submittedAt || 0;
    const submittedAt2 = r2.submittedAt || 0;
    return submittedAt2 - submittedAt1;
}