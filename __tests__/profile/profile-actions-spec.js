import * as actions from '../../src/modules/profile/profile-actions'
import thunk from 'redux-thunk'
import configureMockStore from 'redux-mock-store'
import fetchMock from 'fetch-mock'
import expect from 'expect'

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)
        
const userDetails = {
    first_name:"Emmanuel",
    id:1,
    job_title:"Engineer",
    last_name:"Ssebaggala",
    other_names:"Robert",
    password:"password",
    phone_number:"+256772121988",
    photo:"btsuser@bodastage.org",
    token:"MTIzNDU2Nzg5MTIzNDU2Nzg5",
    username:"btsuser@bodastage.org"
};
        
describe('profile.actions', () => {
    it('should create an action to send profile update request', () => {
        const profileData = {};
        const expectedAction = {
          type: actions.SEND_PROFILE_UPDATE_REQUEST,
          data: profileData
        }
        expect(actions.sendProfileUpdateRequest(profileData)).toEqual(expectedAction)
    })
    
    it('should create an action to notify system of profile update request failure', () => {
        const error = "Profile update failed";
        const expectedAction = {
            type: actions.NOTIFY_PROFILE_UPDATE_FAILURE,
            error: error
        };
        expect(actions.notifyProfileUpdateFailure(error)).toEqual(expectedAction)
    })
    
    it('should create an action to notify system of profile update request success', () => {
        const expectedAction = {
            type: actions.NOTIFY_PROFILE_UPDATE_SUCCESS
        };
        expect(actions.notifyProfileUpdateSuccess()).toEqual(expectedAction)
    })
    
    it('should create an action to notify system to clear profile update error', () => {
        const expectedAction = {
            type: actions.CLEAR_PROFILE_UPDATE_ERROR
        };
        expect(actions.clearProfileUpdateError()).toEqual(expectedAction)
    })
    
});


describe('profile.actions.async', () => {
    afterEach(() => {
        fetchMock.reset()
        fetchMock.restore()
    });
    
    it('should make async request to update the profile details', () => {
        
        const authToken = userDetails.token;
        const profileData = userDetails;
        
        fetchMock
        .getOnce('/api/users', { body:{}, headers: {"Authorization": authToken }})

        const store = mockStore({session: {userDetails: userDetails}})
        
        const expectedActions = [
            {
                type: actions.SEND_PROFILE_UPDATE_REQUEST,
                 data: profileData
            },{
                type: actions.NOTIFY_PROFILE_UPDATE_SUCCESS
          }
        ];
        
        return store.dispatch(actions.updateUserProfile(profileData))
            .then(() => {
                const actions = store.getActions();
                expect(actions).toEqual(expectedActions) 
        });
    });
});