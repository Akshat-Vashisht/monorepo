import { Role } from "./types"

const isLocalHost = (url: string) => {
    return url.includes("localhost") || url.includes("127.0.0.1")
}


export const getApiUrl = (href: string) => {
    if (isLocalHost(href)) {
        return `https://testing.staging.api.pagopeople.com`
    }
    const subdomain = getSubdomain(href);
    if (href.includes("staging.pagopeople.com")) {
        return `https://${subdomain}.staging.api.pagopeople.com`;
    }
    if (href.includes("pagopeople.com")) {
        return `https://${subdomain}.api.pagopeople.com`;
    }

    throw new Error(`Unrecognized href ${href}`);
}

export const getSubdomain = (href: string) => {
    if (isLocalHost(href)) {
        return 'testing';
    }
    return href.split(".")[0].replace("http://", "").replace("https://", "");

}

export const getRolesAsList = () => {
    return (Object.keys(Role) as Array<keyof typeof Role>).filter(k => typeof k !== 'number' && k !== 'SystemAdmin') 
}