import React, {Component} from 'react';
import {BrowserRouter, Link, Redirect, Route, Switch} from "react-router-dom";
import createBrowserHistory from "history/createBrowserHistory";

import Header from "./Components/Header";
import KeywordsContainer from "./Components/KeywordsContainer";
import SearchForm from "./Components/SearchForm";
import PictureSelection from "./Components/PictureSelection";
import NotFound from "./Pages/NotFound";

import axios from "axios";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import Clarifai from "clarifai";
import FileDrop from 'react-file-drop';

import "./styles/normalize.css"
import './styles/App.css';
import "./styles/imgSelect.css";
import './styles/loader.css';

//fixme - is voting on the same picture after selecting from history works?
//todo - keywords scroll should have an indication icon at overflow
//todo - animations
//todo - set cookie (for visitors history) and api keys if opted for
//todo - refactor the history to be served from the clarafai and in turn the selectPicture (less resource intensive? find out)
//todo - icon of tick&cross(that means refactor concepts to serve from clarafai) individual concept vote (tick&X on hover) - changes bg color;
//todo - UI color contrast fix
//todo - move functions into a component for cleaner code
//todo - add support for other image recognition apis (google microsoft amazon) + maybe add a feature that pits them against each other
//todo - add compliance with pexels guideline
//todo - add unsplash api

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            imgSelection: false,
            photosBuffer:[],
            photosHistory:[],
            votedOn: true,
            color: "",
            textColor: "",
            currentUrl: "",
            counter: {
                Wrong: 0,
                Correct: 0,
            },
            apiKeys:{
                pexelsKey: "",
                clarifaiKey:"",
            },
            clarifai: [],
            clarifaiConcepts:null,
            currentClarifaiId: "",
        }
    }

    getRandomPic = () => {
        this.setState({loading: true});
        return axios.get('https://picsum.photos/' + window.innerHeight + '/' + window.innerWidth, {
            maxRedirects: 1
        });
    };

    isValidPicURL = str =>{
        var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name and extension
            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
            '(\\:\\d+)?'+ // port
            '(\\/[-a-z\\d%@_.~+&:]*)*'+ // path
            '(\\?[;&a-z\\d%@_.,~+&:=-]*)?'+ // query string
            '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        //todo - add swal to tell about format
        return (pattern.test(str) && /\.(jpe?g|png|gif|bmp)$/g.test(str));
    };


    //fixme - the drop animation flashes around the header
    handleDrop = (files, event) =>{
        event.stopPropagation();
        event.preventDefault();
        let domNode = document.getElementById("arrow");
        domNode.classList.add("arrow-down");
        const reader = new FileReader();
        //only runs if is single file in valid format
        if (files.length < 2 && /\.(jpe?g|png|gif|bmp)$/g.test(files[0].name)){
            //convert to bas64
            reader.onloadend = (fileLoadedEvent) => {
                const B64 =  fileLoadedEvent.target.result;
                this.setState({
                    currentUrl: B64,
                    photosHistory:[...this.state.photosHistory, {
                        //todo - check if the id already exists
                        id: Math.random(),
                        large_url: B64,
                        url: B64,
                        site:"user_provided"
                    }]
                });
                this.performAnalysis(B64);
                domNode.classList.remove("arrow-down");
            };
        } else {
            const alert = withReactContent(Swal);
            alert.fire({
                type: "error",
                title: "Oops... too many files!",
                text: "You can only set one picture at a time.",
                showConfirmButton: false,
                customClass: "alertBox",
                width: "45%",
                background: "rgba(255,255,255, 0.85)"
            });
        }
        if (files) {
            reader.readAsDataURL(files[0]);
        }
    };

    findElement = (array, id, option) =>{
        //todo - use switch statement
        //option 1 = concept
        //option 2 = photo history
        //option 3 = clarifai object
        let object = null;
        if (option === 1) {
            //only run if exists
            if (!!array) {
                array.find((element)=>{
                    if (element.outputs.id === id){

                    }
                });
                //find the clarifai object save the concepts
            } else {
                return false
            }
        }
        if (option === 2) {
            array.find((element)=>{if (element.id === id){
                object = element;
            }})
        }
        if (option === 3) {
            array.find((element)=>{if (element.outputs[0].id === id){
                object = element;
            }})
        }
        return object;
    };
    performSearch = query => {
        query.preventDefault();
        query.persist();
        //start the loading animation
        this.setState({loading: true});

        //runs if the input is url
        if (this.isValidPicURL(query.target.input.value) === 2 ) {
            this.setState({
                currentUrl: query.target.input.value,
                loading: true,
                photosHistory: [...this.state.photosHistory, {large_url: query.target.input.value}]
            }, this.performAnalysis(this.state.currentUrl));
        }

        //runs if no input
        else if (query.target.input.value === ""){
            this.getRandomPic().then(resp=>{
                this.setState({
                    currentUrl: resp.request.responseURL,
                    photosHistory: [...this.state.photosHistory,  {
                        //this to be reworked, I just quickly added the object as that's what the spashbase used to sent back
                        id: Math.random(),
                        large_url: resp.request.responseURL
                    }],
                    loading: false,
                });
            }).then(()=>{
                this.performAnalysis(this.state.currentUrl)
            });
        }

        //runs when the url is invalid or there's a search term
        else {
            //fetch the photo and pushes it into the array then calls the perform analysis
            axios.get(`${'https://cors-anywhere.herokuapp.com/'}http://www.splashbase.co/api/v1/images/search?query="${query.target.input.value}"`)
                .then(resp => {
                    if (resp.data.images.length>0) {
                        this.setState({
                            photosBuffer: resp.data.images,
                            //to follow the program check out the renderApp method
                            imgSelection: true,
                        });
                        //to save api request limit:
                    } else if (resp.data.images.length < 4 && this.state.apiKeys.pexelsKey){
                        this.pexelsSearch(query.target.input.value);
                    } else {
                        const alert = withReactContent(Swal);
                        //todo - if no pexels key give them option to input
                        alert.fire({
                            type: "error",
                            title: "Oops... no result!",
                            text: "Try something else.",
                            showConfirmButton: false,
                            customClass: "alertBox",
                            width: "45%",
                            background: "rgba(255,255,255, 0.85)"
                        });
                        this.setState({loading: false});

                    }
                })
                .catch(error => {
                    this.setState({loading: false});
                    console.log('Error during fetching, parsing data or setting state of the photo: ' + error);
                });
        }
    };

    pexelsSearch = searchTerm =>{
        //comfort to and push the buffer
        searchTerm = searchTerm.replace(/ +/g, '+');
        axios({
            method: "get",
            url:"https://api.pexels.com/v1/search?query=" + searchTerm + "&per_page=15&page=1",
            headers: {
                Authorization: this.state.apiKeys.pexelsKey,}
        }).then(resp =>{
            function mapper(resp){
                return resp.data.photos.map(photo =>{
                    return {
                        id: photo.id,
                        large_url: photo.src.large2x,
                        site: "pexels",
                    };
                });
            }
            this.setState({
                photosBuffer: this.state.photosBuffer.concat(mapper(resp)),
                imgSelection: true,
            });
        }).catch(e=>{console.log("Nothing from pexels: " + e)});
    };

    //available clarafai models
    //general: Clarifai.GENERAL_MODEL
    //apparel: e0be3b9d6a454f0493ac3a30784001ff
    //celebrity: e466caa0619f444ab97497640cefc4dc
    //color: eeed0b6733a644cea07cf4c60f87ebb7
    //demographics: c0c0ac362b03416da06ab3fa36fb58e3
    //food: bd367be194cf45149e75f01d59f77ba7
    //textures & patterns: fbefb47f9fdb410e8ce14f24f54b47ff
    //travel: eee28c313d69466f836ab83287a54ed9
    //wedding: c386b7a870114f4a87477c0824499348
    performAnalysis = (url, model = Clarifai.GENERAL_MODEL) =>{
        // if (url.slice(0, 11) === "data:image/"){
        //     //regex matches everything before ";base64,"
        //     url =  {base64: url.replace(/^(.*?);base64,/, "")};
        // }
        const clarifai = new Clarifai.App({
            //todo - create UI clarifai model selection
            apiKey: this.state.apiKeys.clarifaiKey,});
        // this.performColorAnalysis(url);
        clarifai.models.predict(model,  url, {maxConcepts: 10})
            .then((res) =>{
                    this.setState({
                        //todo - eliminate unused data
                        clarifai: [...this.state.clarifai, res],
                        //this can be eliminated on serving from clarafai
                        clarifaiConcepts: res.outputs[0].data.concepts,
                        currentClarifaiId: res.outputs[0].id,
                        photosHistory: this.state.photosHistory.map((element, i)=>{
                            //last item is always the latest
                            if (i === this.state.photosHistory.length-1){
                                element.clarifaiId = res.outputs[0].id
                            }
                            return element
                        }),
                        loading: false,
                    });
                },
                (err)=>{
                    const alert = withReactContent(Swal);
                    alert.fire({
                        type: "error",
                        title: "An error occurred at the analysis stage: ",
                        text: err.statusText,
                        showConfirmButton: false,
                        customClass: "alertBox",
                        width: "45%",
                        background: "rgba(255,255,255, 0.85)"
                    });
                    console.log("An error occurred at the analysis stage: ");
                    console.dir(err);
                })
            .then(this.setState({
                imgSelection: false,
                photosBuffer:[],
                votedOn: false,
            }));
        document.getElementById("search-bar").value = "";
    };
    //fixme - colors doesn't work

    // performColorAnalysis = url =>{
    //     clarifai.models.predict(Clarifai.COLOR_MODEL, url, {maxConcepts: 1}).then((res)=>{
    //         this.state.color = this.calculateColors(res.data.colors[0].raw_hex, true);
    //         this.setState(this.state);
    //     }).catch(err=>{
    //         console.log("error back from color analysis: " + err)
    //     })
    // };
    calculateColors = (hex, bw) =>{
        if (hex.indexOf('#') === 0) {
            hex = hex.slice(1);
        }
        // convert 3-digit hex to 6-digits.
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        if (hex.length !== 6) {
            throw new Error('Invalid HEX color.');
        }
        let r = parseInt(hex.slice(0, 2), 16),
            g = parseInt(hex.slice(2, 4), 16),
            b = parseInt(hex.slice(4, 6), 16);
        if (bw) {
            // taken from http://stackoverflow.com/a/3943023/112731
            const textcolor = (r * 0.299 + g * 0.587 + b * 0.114) > 186
                ? '#000000'
                : '#FFFFFF';
            this.setState({textColor: textcolor});
        }
        // invert color components
        r = (255 - r).toString(16);
        g = (255 - g).toString(16);
        b = (255 - b).toString(16);
        // pad each with zeros and return
        return `#${r}${g}${b}`;
    };

    increaseScore = subject =>{
        //this condition allows only one vote/picture
        if (!this.state.votedOn) {
            this.setState({
                votedOn: true,
                //with bracket notation you can accept the string as the property
                counter: {
                    ...this.state.counter,
                    [subject]: this.state.counter[subject] + 1,
                },
                photosHistory: this.state.photosHistory.map((element)=>{
                    if (element.large_url === this.state.currentUrl){
                        element.fair = subject;
                    }
                    return element
                }),
            });
        } else{
            const alert = withReactContent(Swal);
            if (this.state.counter.Wrong === 0 && this.state.counter.Correct === 0) {
                alert.fire({
                    type: "error",
                    title: "No concepts to vote on...",
                    text: "Try a new search!",
                    showConfirmButton: false,

                    customClass: "alertBox",
                    width: "45%",
                    background: "rgba(255,255,255, 0.85)"
                });
            }
            else if (this.state.votedOn) {
                alert.fire({
                    type: "error",
                    title: "You already voted...",
                    text: "Try a new search!",
                    showConfirmButton: false,

                    customClass: "alertBox",
                    width: "45%",
                    background: "rgba(255,255,255, 0.85)"
                });
            }
        }
    };
    keywordVote = (status, votedOn, id) => {
        this.setState({
            clarifai: this.state.clarifai.map(
                (element) => {
                    if (element.outputs[0].id === this.state.currentClarifaiId) {
                        return {
                            outputs: [
                                {
                                    created_at: element.outputs[0].created_at,
                                    data: (element.outputs[0].data.concepts.map(
                                            //fixme - can only vote once
                                            (concept) => {
                                                if (concept.id === id) {
                                                    return {
                                                        app_id: concept.app_id,
                                                        id: concept.id,
                                                        name: concept.name,
                                                        value:concept.value,
                                                        status: status,
                                                        votedOn: votedOn,
                                                    }
                                                } else return concept;
                                            })
                                    ),
                                    input: element.outputs[0].input,
                                    model: element.outputs[0].model,
                                    status: element.outputs[0],
                                }
                            ],
                            rawData: element.rawData,
                            status: element.status,
                        };
                    } else return element;
                }
            ),
        });
    };

    closeSelectPicture = () =>{
        this.setState({
            imgSelection: false,
            photosBuffer: [],
            loading: false
        });
    };
    //fixme - there's got to be a more efficient way than using a buffer
    selectPicture = id =>{
        //handles both selection before analysis and selection from history
        const element = this.findElement(this.state.photosHistory, id, 2);
        //element exists in the history stack?
        if (element) {
            this.setState({
                currentUrl: element.large_url,
                // fixme - can only set the concepts array once (the array setting error in console might have something to do with it)
                currentClarifaiId: element.clarifaiId,
                clarifaiConcepts: this.state.clarifai[
                    this.state.clarifai.findIndex((item)=>{
                        //fetches the correct photo's clarifai id from history and compares it to the element id if matched it returns the index
                        return (()=>{if (item.outputs[0].id === element.claifaiId){
                            return item} else {
                            //todo - fallback
                        }})
                    })
                    ].outputs[0].data.concepts,
                imgSelection: false,
            });

        }
        else{
            const bufferElement = this.state.photosBuffer.find((element)=> {
                if (element.id === id) {
                    return element;
                }
            });
            this.setState({
                photosHistory: [...this.state.photosHistory, bufferElement],
                imgSelection: false,
                currentUrl: bufferElement.large_url,
            });
            this.performAnalysis(bufferElement.large_url);
        }
    };

    swalKeys = () => {
        const customHistory = createBrowserHistory();
        if (!this.state.apiKeys.clarifaiKey && customHistory.location.pathname === "/") {
            Swal({
                type: "info",
                title: 'API key(s) needed!',
                html:'<form><fieldset class="form-flex"> <legend>API Keys</legend><div class="clarafaiKey"><label for="clarafaiKey">Clarafai Key:<sup style="color: red;">*</sup></label><input id="clarafaiKey" type="text" placeholder="Your Clarafai API key here" required autofocus></div><div class="pexelsKey"><label for="PexelsKey">Pexels:</label><input id="pexelsKey" type="text" placeholder="Your Pexels API key here"></div></fieldset></form>',

                customClass: "alertBox",
                background: "rgba(255,255,255, 0.85)",
                focusConfirm: false,
                allowOutsideClick: false,
                preConfirm: () => {
                    const formValues =  [
                        document.getElementById('clarafaiKey').value,
                        document.getElementById('pexelsKey').value
                    ];

                    if(formValues[0].length === 32){
                        //won't check for pexels as it's not critical for the functioning
                        if(formValues[1] && formValues[1].length !== 56){
                            Swal.showValidationError("The Pexels key should be 56 characters");
                        } else {
                            return formValues
                        }
                        return formValues
                    } else {
                        Swal.showValidationError("The Clarafai key should be 32 characters");
                    }
                }
            }).then((formValues)=>{
                this.setState({
                    apiKeys: {
                        clarifaiKey: formValues.value[0],
                        pexelsKey: formValues.value[1]
                    }
                });
            });
        }
    };
    componentWillMount() {
        this.getRandomPic().then(resp=>{
            this.setState({currentUrl: resp.request.responseURL, loading: false});
        }).catch((e)=>{
            const alert = withReactContent(Swal);
            alert.fire({
                type: "error",
                title: "Could not fetch the initial background: ",
                text: e,
                showConfirmButton: false,
                customClass: "alertBox",
                width: "45%",
                background: "rgba(255,255,255, 0.85)"
            });
            console.log("Could not fetch the initial background: " + e);
            this.setState({loading: false});
        });
        this.swalKeys();
    }

    renderApp = () =>{
        return (
            <FileDrop
                onDrop={this.handleDrop}
                onDragOver={()=>{document.getElementById("arrow").classList.add("arrow-down");}}
                onDragLeave={()=>{document.getElementById("arrow").classList.remove("arrow-down");}}>
                {/*the span element is part of the dropzone animation*/}
                <span id={"arrow"}></span>
                {this.state.imgSelection
                    ?
                    <PictureSelection close={this.closeSelectPicture} pictures={this.state.photosBuffer} selectPicture={this.selectPicture}/>
                    :
                    <Header counter={this.state.counter}/>
                }
                <div className="searchKeywordContainer">
                    <SearchForm loading={this.state.loading} performSearch={this.performSearch} increaseScore={this.increaseScore}/>
                    {this.state.clarifai.length>0
                        ?
                        //errorpage hardcoded as only 2 instance exists of the KeywordContainer
                        <KeywordsContainer
                            keywordVote={this.keywordVote}
                            errorPage={false}
                            concepts={this.state.clarifaiConcepts}
                        />
                        :
                        <span></span>}
                </div>
            </FileDrop>
        );
    };
    noHistoryAlert = () => {
        const alert = withReactContent(Swal);
        alert.fire({
            type: "error",
            title: "Oops... Nothing to see here!",
            text: "Try searching first.",
            showConfirmButton: false,

            customClass: "alertBox",
            width: "45%",
            background: "rgba(255,255,255, 0.85)"
        });
    };
    isPictureSelection = () =>{
        return (<PictureSelection  pictures={this.state.photosHistory} selectPicture={this.selectPicture}/>)

    };
    renderHistory = () =>(
        <div className="PictureSelectionWrapper">
            <Link to="/" className="close"></Link>
            <div className="flexBox">
                {this.state.photosHistory.length>0
                    ?
                    this.isPictureSelection()
                    :
                    (this.noHistoryAlert(),
                        (<Redirect to="/"/>))
                }
            </div>
        </div>);

    render(){
        return (
            <div id="background"  style={{backgroundImage: `url(${this.state.currentUrl})`}}>
                <BrowserRouter>
                    <Switch>
                        {/*routes calling functions because "this" is out of the namespace and cannot be binded?*/}
                        <Route exact path="/" render={()=>this.renderApp()}/>
                        <Route path="/history" history={this.props.history} render={()=>this.renderHistory()}/>
                        <Route path="/" component={props => <NotFound keywordVote={this.keywordVote}
                                                                      swalKeys={this.swalKeys}/>}/>
                    </Switch>
                </BrowserRouter>
            </div>
        );
    }
}
export default(App);
