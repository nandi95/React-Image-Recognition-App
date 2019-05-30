import React from "react";
import PropTypes from "prop-types";
import Picture from "./Picture";

const PictureSelection = props => {
    return (
        <div className="PictureSelectionWrapper">
            <div onClick={props.close} className="close"></div>
            <div className="flexBox">
                {props.pictures.map((picture) =>
                    <Picture
                        selectPicture={() => props.selectPicture(picture.id)}
                        url={picture.large_url}
                        key={picture.id}
                        id={picture.id}
                        fair={picture.fair}
                    />
                )}
            </div>
        </div>
    );
};
PictureSelection.propTypes = {
    pictures: PropTypes.array.isRequired,
    selectPicture: PropTypes.func.isRequired,
    close: PropTypes.func,
};
export default PictureSelection;
