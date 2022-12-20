import React from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { green, red } from '@mui/material/colors';
import TidalAPI from '../service/KKBoxAPI';
import { Metrics } from '../service/Structs';

const API = TidalAPI.Instance;

export default function Chart() {
    const [data, setData] = React.useState<any[]>();

    React.useEffect(() => {
        const one_day = 86400000;
        async function loadData() {
            if (document.visibilityState === "visible" && API.isAuth) {
                const metrics_data = await API.report.metrics();
                const chart_data: any[] = [];
                const today = new Date().getTime();
                for (let i = 6; i >= 0; i--) {
                    const date = new Date(today - one_day * i);
                    chart_data.push({
                        date: `${date.getDate()}/${date.getMonth() + 1}`,
                        success: 0,
                        failed: 0
                    });
                }
                metrics_data.forEach((metrics: Metrics) => {
                    const split = metrics.Date.split('/');
                    const date = `${split[0]}/${split[1]}`;
                    for (var i = 0; i < chart_data.length; i++) {
                        if (chart_data[i].date === date) {
                            chart_data[i].success = metrics.Success;
                            chart_data[i].failed = metrics.Failed;
                            break;
                        }
                    }
                });
                setData(() => chart_data);
            }
        }
        loadData();
        const interval = setInterval(loadData, 3000);
        return () => clearInterval(interval);
    }, []);

    function formatYAxis(value: any) {
        if (value >= 1000000) {
            return `${value / 1000000}M`;
        }
        else if (value >= 1000) {
            return `${value / 1000}K`;
        }
        else {
            return value;
        }
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="color_success" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={green[400]} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={green[400]} stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="color_failed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={red[400]} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={red[400]} stopOpacity={0.05} />
                    </linearGradient>
                </defs>
                <XAxis dataKey="date" fontSize={13} />
                <YAxis fontSize={13} tickFormatter={formatYAxis} />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip isAnimationActive={false} />
                <Area dataKey="failed" isAnimationActive={false} stroke={red[400]} fillOpacity={1} fill="url(#color_failed)" />
                <Area dataKey="success" isAnimationActive={false} stroke={green[400]} fillOpacity={1} fill="url(#color_success)" />
            </AreaChart>
        </ResponsiveContainer>
    );
}