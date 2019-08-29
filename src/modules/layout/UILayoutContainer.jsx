import React, { Suspense }  from 'react';

const UILayout = React.lazy(() => import('./UILayout'));

export default class UILayoutContainer extends React.Component {
	render(){
		return (
			<div>
				<Suspense fallback={<div>Loading...</div>}>
					<UILayout />
				</Suspense>
			</div>
		);
	}
}