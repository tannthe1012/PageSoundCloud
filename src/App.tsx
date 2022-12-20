import "./App.css"
import { AppBar, Container, Toolbar, Typography } from '@mui/material';
import React from 'react';
import LoginDialog from './component/LoginDialog';
import TidalAPI from './service/KKBoxAPI';
import { Route, Routes } from "react-router-dom";
import Overview from "./page/Overview";
import ImportDialog from "./component/ImportDialog";

const API = TidalAPI.Instance;

function App() {
	const [login, setLogin] = React.useState(false);

	React.useEffect(() => {
		API.reAuth().then((success) => setLogin(!success));
	}, []);

	return (
		<div>
			<AppBar position="static">
				<Container maxWidth="xl">
					<Toolbar disableGutters>
						<Typography
							variant="h6"
							noWrap
							sx={{
								mr: 2,
								display: { xs: 'none', md: 'flex' },
								fontFamily: 'monospace',
								fontWeight: 700,
								color: 'inherit',
								textDecoration: 'none',
							}}
						>
							SOUNDCLOUD
						</Typography>
						<Typography
							variant="h5"
							noWrap
							sx={{
								mr: 2,
								display: { xs: 'flex', md: 'none' },
								flexGrow: 1,
								fontFamily: 'monospace',
								fontWeight: 700,
								color: 'inherit',
								textDecoration: 'none',
							}}
						>
							SOUNDCLOUD
						</Typography>
					</Toolbar>
				</Container>
			</AppBar>
			<Container maxWidth="lg">
				<Routes>
					<Route path="/" element={<Overview />}/>
					<Route path="/test" element={<ImportDialog />}/>
				</Routes>
			</Container>
			<LoginDialog open={login} onSucces={() => setLogin(false)} />
		</div>
	);
}

export default App;
