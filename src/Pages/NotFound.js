import React from 'react';
import {Link} from "react-router-dom";
import KeywordsContainer from "../Components/KeywordsContainer";
import PropTypes from "prop-types";

const NotFound = (props) =>{
    return (
        <div onClick={()=>{props.swalKeys()}}><Link to={"/"}><span className={"go-back"}>Back to the app</span></Link>
            <div className="searchKeywordContainer">
                <div className={"error404-container"}>
                    <div className={"error404"}>404</div>
                </div>
                <div className={"404-words"}>
                    <KeywordsContainer keywordVote={props.keywordVote} errorPage={true} concepts={[
                        {
                            id: "r0",
                            name: "404",
                            value: 1,
                        },
                        {
                            id: "r1",
                            name: "not found",
                            value: 0.9998,
                        },
                        {
                            id: "r2",
                            name: "oh no!",
                            value: 0.9843,
                        },
                        {
                            id: "r3",
                            name: "error",
                            value: 0.9774,
                        },
                        {
                            id: "r4",
                            name: "oops!",
                            value: 0.9426,
                        },
                        {
                            id: "r5",
                            name: "sorry",
                            value: 0.9392,
                        },
                        {
                            id: "r6",
                            name: <a href={"https://www.youtube.com/watch?v=lRpxecLkUHQ"}>nyan cat</a>,
                            value: 0.8791,
                        },
                        {
                            id: "r7",
                            name: "nothing's here",
                            value: 0.7432
                        },
                        {
                            id: "r8",
                            name: "spooky scary",
                            value: 0.7261,
                        },
                        {
                            id: "r9",
                            name: "edgy memes",
                            value: 0.6154,
                        },
                        {
                            id: "r10",
                            name: "ʅ( ͡° ͜ʖ ͡°)ʃ",
                            value: 0.4584,
                        },
                    ]}/>
                </div>
            </div>
        </div>
    );
};
NotFound.propTypes = {
    keywordVote: PropTypes.func,
    swalKeys: PropTypes.func.isRequired
};

export default NotFound;
