import React, { useState } from 'react';

function CacheMiss() {
    const [data, setData] = useState(null);
    const [id, setId] = useState('');
    const [lastUpdated, setLastUpdated] = useState('*');
    const [etag, setEtag] = useState('*');

    const handler = (e)=>{
        setId(e.target.value);
        setEtag("*");
    }

    const fetchData = async () => {
        const headers = {};

        if (lastUpdated) {
          headers['If-Modified-Since'] = lastUpdated;
        }
        if(etag){
            console.log('inside',etag);
            headers['If-None-Match'] = etag;
            console.log(headers);
        }
    
        const response = await fetch(`http://localhost:3000/data/${id}`,{headers:{'If-Modified-Since':headers['If-Modified-Since'],'If-None-Match':headers['If-None-Match']}});
        if (response.status === 304) {
            // Resource not modified, use cached data
            console.log('Resource not modified');
            return;
          }
        const data = await response.json();
        const etagData = response.headers.get('etag');
        setLastUpdated(response.headers.get('Last-Modified'));
        setEtag(etagData);
        setData(data);
    };

    return (
        <div>
            <input type="text" value={id} onChange={handler} />
            <button onClick={fetchData}>Fetch Data</button>
            <button onClick={() => setId('')}>Clear</button>
            {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
        </div>
    );
}

export default CacheMiss;