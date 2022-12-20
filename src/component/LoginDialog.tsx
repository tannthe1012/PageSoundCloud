import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import DialogContent from '@mui/material/DialogContent';
import { Alert, Avatar, Box, CircularProgress, Collapse, Snackbar, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import TidalAPI from '../service/KKBoxAPI';

const API = TidalAPI.Instance;

interface Props {
    open: boolean,
    onSucces: () => void
}

export default function LoginDialog(props: Props) {
    const [loading, setLoading] = React.useState(false);
    const [alert, setAlert] = React.useState<{
        show: boolean,
        content: string,
        variant: 'success' | 'info' | 'warning' | 'error'
    }>({
        show: false,
        content: "",
        variant: 'info'
    });

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const username = data.get('username') as string;
        const password = data.get('password') as string;

        if (username === "" || password === "") {
            setAlert({
                show: true,
                content: "Username and password cannot be blank.",
                variant: 'error'
            });
            return;
        }
        setLoading(true);

        API.auth(username, password).then((success) => {
            if (success) {
                props.onSucces();
            }
            else {
                setAlert({
                    show: true,
                    content: "Incorrect username or password.",
                    variant: 'error'
                });
            }
            setLoading(false);
        }).catch(() => {
            setAlert({
                show: true,
                content: "Some error occurred, please try again later.",
                variant: 'error'
            });
            setLoading(false);
        });
    }

    function handleInput() {
        setAlert({
            show: false,
            content: alert.content,
            variant: alert.variant
        });
    }

    return (
        <Dialog open={props.open} maxWidth="xs" fullScreen={fullScreen}>
            <DialogContent>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}><LockOutlinedIcon /></Avatar>
                    <Typography component="h1" variant="h5">Login</Typography>
                </Box>

                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }} >
                    <Collapse in={alert.show}>
                        <Alert severity={alert.variant}>{alert.content}</Alert>
                    </Collapse>
                    <TextField
                        id="username"
                        name="username"
                        label="Username"
                        margin="normal"
                        autoComplete="username"
                        onInput={handleInput}
                        required
                        fullWidth
                        autoFocus
                    />
                    <TextField
                        id="password"
                        type="password"
                        name="password"
                        label="Password"
                        margin="normal"
                        autoComplete="password"
                        onInput={handleInput}
                        required
                        fullWidth
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        sx={{ mt: 3, mb: 0 }}
                        disabled={loading}
                        fullWidth
                    >
                        {loading && (<CircularProgress
                            size={20}
                            sx={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                marginTop: "-10px",
                                marginLeft: "-10px",
                            }}
                        />)}
                        Login
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
}