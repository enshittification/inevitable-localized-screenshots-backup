import React from 'react';
import { useParams } from 'react-router-dom';

import Nav from '/components/nav';
import Editor, { EditorProvider } from '/components/editor';
import {
	useScreenshotsStore,
	useSelectedScreenshot,
	useCanvasStore,
} from '/state';
import { imageToDataURL } from '/lib/helpers';
import { request } from '/web-sockets';

function SessionController( { project, width, height } ) {
	React.useEffect( () => {
		request( 'startSession', {
			project,
			width,
			height,
		} );

		return () => request( 'stopSession' );
	}, [] );

	return null;
}

function ScreenshotsRequestController() {
	const { screenshotId } = useParams();
	const { setScreenshots, setSelectedScreenshotIndex } =
		useScreenshotsStore();
	const { setLockedScreen, setSize, setAnnotations, setActions } =
		useCanvasStore();

	React.useEffect( () => {
		fetch( `/api/screenshot/${ screenshotId }`, {
			method: 'GET',
		} )
			.then( ( response ) => response.json() )
			.then( async ( payload ) => {
				return Promise.all(
					payload.map( async ( { meta, locale, url, id } ) => {
						const data = await imageToDataURL( url );

						return {
							id,
							data,
							meta: {
								locale,
								actions: meta.actions,
								page: meta.page,
								offset: meta.offset,
								project: meta.project,
							},
							annotations: meta.annotations,
						};
					} )
				).then( ( screenshots ) => {
					const parentScreenshot = screenshots[ 0 ];
					const { annotations, meta } = parentScreenshot;
					const { page } = meta;

					setLockedScreen( { page } );
					setActions( meta.actions );
					setAnnotations( annotations );
					setScreenshots( screenshots );
					setSize( {
						width: meta?.project?.width,
						height: meta?.project?.height,
					} );
					setSelectedScreenshotIndex( 0 );
				} );
			} );
	}, [ screenshotId ] );

	return null;
}

export default function PageEdit() {
	const selectedScreenshot = useSelectedScreenshot();
	const projectProps = selectedScreenshot?.meta?.project;

	return (
		<EditorProvider>
			{ projectProps && <SessionController { ...projectProps } /> }

			<ScreenshotsRequestController />

			<Nav />

			<Editor />
		</EditorProvider>
	);
}
