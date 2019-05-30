import React from "react";
import PropTypes from "prop-types";
import '../styles/loader.css';

const Picture = props => {
//todo - imgSelection indication of loading (each pic could have a loading animation until the while the resp header is not set, when set check if its <400
    //thing is Picture is only called when data is present
    return (
        <div className="flexItem" style={{backgroundImage: `url(${props.url})`}}>
            <div className="selectPic">
                {props.url === "string" ? <div className="lds-dual-ring"></div> :
                    <button className="button1" onClick={props.selectPicture}>Select</button>}
                <span className={`fair ${props.fair}`}>{(props.fair)}</span>
            </div>
        </div>
    );
};
Picture.propTypes = {
    selectPicture: PropTypes.func.isRequired,
    url: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired,
    fair: PropTypes.string,
};
export default Picture;
