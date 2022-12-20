import axios from 'axios';
import { AxiosRequestConfig } from 'axios';
import { ClientReportData, Metrics, ProfileReportData, ReceiveData, ReportData, SendData, SourceExcelRow } from './Structs';

export class ReportBranch {
    api: TidalAPI;

    constructor(api: TidalAPI) {
        this.api = api;
    }

    async get(): Promise<ReportData> {
        const data = await this.api.request<ReportData>({
            Method: "GET",
            Path: "report"
        });
        return data.Data;
    }

    async clients(): Promise<ClientReportData[]> {
        const data = await this.api.request<ClientReportData[]>({
            Method: "GET",
            Path: "report/clients?skip=0&limit=1000&stringfilter"
        });
        return data.Data;
    }

    async profile(): Promise<ProfileReportData> {
        const data = await this.api.request<ProfileReportData>({
            Method: "GET",
            Path: "report/profile"
        });
        return data.Data;
    }

    async metrics(): Promise<Metrics[]> {
        const data = await this.api.request<Metrics[]>({
            Method: "GET",
            Path: "report/metrics"
        });
        return data.Data;
    }
}

export class ProfileBranch {
    api: TidalAPI;

    constructor(api: TidalAPI) {
        this.api = api;
    }

    async countQueue(): Promise<number> {
        const data = await this.api.request<number>({
            Method: "GET",
            Path: "profile/queue/count"
        });
        return data.Data;
    }

    async countByStatus(status: ProfileStatus): Promise<number> {
        const data = await this.api.request<number>({
            Method: "GET",
            Path: `profile/count?profile_status=${status.toString()}`
        });
        return data.Data;
    }

    async countByType(type: ProfileType): Promise<number> {
        const data = await this.api.request<number>({
            Method: "GET",
            Path: `profile/count?profile_type=${type.toString()}`
        });
        return data.Data;
    }
}

export class SourceBranch {
    api: TidalAPI;

    constructor(api: TidalAPI) {
        this.api = api;
    }

    async import(sources: SourceExcelRow[]): Promise<boolean> {
        const data = await this.api.request<SourceExcelRow[]>({
            Method: "POST",
            Path: "source/import",
            Body: sources
        });
        return data.Success;
    }

    async export(): Promise<SourceExcelRow[]> {
        const data = await this.api.request<SourceExcelRow[]>({
            Method: "GET",
            Path: "source/export"
        });
        return data.Data;
    }

    async remove(artist_ids: string[]): Promise<boolean> {
        const data = await this.api.request<SourceExcelRow[]>({
            Method: "POST",
            Path: "source/remove",
            Body: artist_ids
        });
        return data.Success;
    }
}

export enum ProfileStatus {
    Good,
    Bad,
    Expired
}

export enum ProfileType {
    Prem = 1,
    Free = 2,
}

export default class TidalAPI {

    static readonly Instance: TidalAPI = new TidalAPI();

    //private readonly host: string = "http://tidal.xnight.ml";
    // private readonly host: string = "";
    private readonly host: string = "http://kkbox.xnight.ml:3031";
    report: ReportBranch;

    profile: ProfileBranch;

    source: SourceBranch;

    public isAuth: boolean;

    protected constructor() {
        this.report = new ReportBranch(this);
        this.profile = new ProfileBranch(this);
        this.source = new SourceBranch(this);
        this.isAuth = false;
    }

    async request<T>(send: SendData): Promise<ReceiveData<T>> {
        const config: AxiosRequestConfig = {
            url: `${this.host}/api/${send.Path}`,
            headers: {}
        };

        if (send.Method.toLowerCase() === "get") {
            config.method = "GET";
        }
        else if (send.Method.toLowerCase() === "post") {
            config.method = "POST";
            config.data = JSON.stringify(send.Body);
            if (config.headers != null) {
                config.headers["Content-Type"] = "application/json";
            }
            else {
                config.headers = { "Content-Type": "application/json" };
            }
        }
        else {
            throw `KKBoxAPI cannot support method: ${send.Method}`;
        }

        const token = localStorage["auth_token"];
        if (token != null && config.headers != null) {
            config.headers["Authorization"] = token;
        }

        const response = await axios(config);
        return response.data as ReceiveData<T>;
    }

    async auth(username: string, password: string): Promise<boolean> {
        const data: ReceiveData<any> = await this.request<any>({
            Method: "POST",
            Path: "admin/auth",
            Body: {
                "Username": username,
                "Password": password
            }
        });

        if (data.Success) {
            this.isAuth = true;
            localStorage["auth_token"] = "Basic " + btoa(username + ":" + password);
        }

        return data.Success;
    }

    async reAuth(): Promise<boolean> {
        const token = localStorage["auth_token"];
        if (token != null && token.startsWith("Basic ")) {
            const data = atob(token.substring(6)).split(":");
            if (data.length === 2) {
                return await this.auth(data[0], data[1]);
            }
        }
        return false;
    }
}