import React, { Component, Button } from 'react'
import PCMPlayer from './PCMPlayer'

class AudioWidget extends Component {
    componentWillMount() {
        // super(props);
        this.player = new PCMPlayer({
            encoding: '16bitInt',
            channels: 1,
            sampleRate: 11025,
            flushingTime: 2000
        });

        this.handleNewData = this.handleNewData.bind(this)
    }

    componentDidMount() {
    }

    handleNewData(newData) {
        console.log("Feeding new data")
        let volumeAdjustedData = newData.map((value) => { return value*25 })
        this.player.feed(new Int16Array(volumeAdjustedData))
    }

    render() {
        return (
            <div>

                Testing5
            </div>
        )
    }
}

export default AudioWidget;


