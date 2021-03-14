import './App.css';
import { useState, useEffect } from 'react';
import {
  Container,
  Navbar,
  NavbarBrand,
  Nav,
  Form,
  FormControl,
  Card,
  ListGroup,
  CardDeck,
  Button,
  Modal,
  Table,
  } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

//https://magicseaweed.com/docs/developers/59/response/9910/
const API_KEY = '?'; // you'll need to request one from magicseaweed
const ENDPOINT = 'http://magicseaweed.com/api/'+API_KEY+'/forecast/';
//start with `node node_modules/cors-anywhere/server.js`
const CORS_WORKAROUND = 'http://localhost:8080/';
const FIELDS = [
    'swell.minBreakingHeight',
    'swell.maxBreakingHeight',
    'swell.unit',
    'wind.speed',
    'wind.unit',
    'wind.compassDirection',
    'solidRating',
  ];
const FIELDS_STR = '?fields='+FIELDS.join(',');
const SPOTS = {
    644:'Pleasure Point',
    163: 'Steamer Lane',
    257: 'Four Mile',
    4214: 'Windansea',
    296: 'Scripps Pier',
    279: 'Malibu',
    162: 'Mavericks',
    62: 'Biarritz',
    617: 'Jaws',
  }

function App() {
  const [search,setSearch] = useState('');

  return (
    <div>
      <Navbar bg='dark' variant='dark'>
        <Nav className='container-fluid'>
          <NavbarBrand>Surf Check</NavbarBrand>
          <Form inline>
            <FormControl
              type="text"
              placeholder="Search"
              onChange={e => setSearch(e.target.value)}
              className="mr-sm-2"
            />
          </Form>
        </Nav>
      </Navbar>
      <Container>
        <CardDeck>
            {Object.keys(SPOTS).map((spot_id, key_idx) => {
            var title = SPOTS[spot_id];
            return <SpotCard
                title={title}
                spot_id={spot_id}
                show={!search || title.toLowerCase().includes(search.toLowerCase())}
                key={key_idx}
            />
            })}
        </CardDeck>
      </Container>
    </div>
  );
}

function SpotCard({title, spot_id, show}){
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const handleModalClose = () => setShowModal(false);
  const handleModalOpen = () => setShowModal(true);

  var api_route = CORS_WORKAROUND+ENDPOINT+FIELDS_STR+'&spot_id='+spot_id.toString();
  useEffect(() => {
    fetch(api_route)
      .then(res => res.json())
      .then(
        result => {
          setData(result[8]); //8 chosen bc close to now
          setLoaded(true);
        })
  }, [api_route]);

  if (!show)
    return null;

  return (
    <Card
      bg={colorByQuality(data)}
      style={{
        minWidth: '18rem',
        maxWidth: '18rem',
        margin:'0.5rem',
    }}>
      <Card.Body>
        <Card.Title style={{color:'white'}}>
          {title}
        </Card.Title>
        <ListGroup>
          <ListGroup.Item>
            {!loaded ? 'Loading...': 'Quality: '+data['solidRating']+' / 5'}
          </ListGroup.Item>
          <ListGroup.Item>
            {!loaded ? 'Loading...': `Wave height:
            ${data['swell']['minBreakingHeight']}
            to ${data['swell']['maxBreakingHeight']}
            ${data['swell']['unit']}`}
          </ListGroup.Item>
          <ListGroup.Item>
            {!loaded ? 'Loading...': `Wind:
            ${data['wind']['speed']}
            ${data['wind']['unit']}
            ${data['wind']['compassDirection']}`
            }
          </ListGroup.Item>
          <ListGroup.Item>
            <Button
              variant='link'
              style={{padding:'0px'}}
              onClick={handleModalOpen}
              >
              More...
            </Button>
            <SpotModal
              show={showModal}
              title={title}
              spot_id={spot_id}
              onHide={handleModalClose}
            />
          </ListGroup.Item>
      </ListGroup>
      </Card.Body>
    </Card>
  );
}

function colorByQuality(data){
  if(!data)
    return 'secondary';
  else if (data['solidRating'] > 4)
    return 'warning';
  else if (data['solidRating'] > 3)
    return 'success';
  else if (data['solidRating'] > 1)
    return 'primary';
  else
    return 'secondary';
}

function SpotModal({title, spot_id, show, onHide}) {
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState(null);
  //don't limit fields
  var full_api_route = CORS_WORKAROUND + ENDPOINT +'?spot_id='+spot_id;

  useEffect(() => {
    if(show){
      fetch(full_api_route)
        .then(res => res.json())
        .then(
          result => {
            setData(result[8]);
            setLoaded(true);
        })
    }
  }, [show,full_api_route]);

  return (
    // workaround: https://github.com/react-bootstrap/react-bootstrap/issues/3105
    <div onClick={e => e.stopPropagation()}>
      <Modal show={show} onHide={onHide}>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table>
            <tr>
              <td>Expected Quality</td><td>{loaded && data['solidRating']}</td>
            </tr>
            <tr>
              <td>Breaking Wave Height</td>
              <td>{loaded &&
                `${data['swell']['absMinBreakingHeight']}
                to
                ${data['swell']['absMaxBreakingHeight']}
                ${data['swell']['unit']}`}
              </td>
            </tr>
            <tr>
              <td>Combined Swell</td>
              <td>{loaded && swellInfo(data,'combined')}</td>
            </tr>
            <tr>
              <td>Primary Swell</td>
              <td>{loaded && swellInfo(data,'primary')}</td>
            </tr>
            {loaded && data['swell']['components']['secondary'] &&
            <tr>
              <td>Secondary Swell</td>
              <td>{swellInfo(data,'secondary')}</td>
            </tr>}
            {loaded && data['swell']['components']['tertiary'] &&
            <tr>
              <td>Tertiary Swell</td>
              <td>{swellInfo(data,'tertiary')}</td>
            </tr>}
            <tr>
              <td>Wind</td>
              <td>{loaded && `
                ${data['wind']['speed']}
                ${data['wind']['unit']}
                ${data['wind']['direction']}deg
                ${data['wind']['compassDirection']}
                `}</td>
            </tr>
          </Table>
        </Modal.Body>
      </Modal>
    </div>
  )
}

function swellInfo(data, whichSwell) {
  return `${data['swell']['components'][whichSwell]['height']}
    ${data['swell']['unit']} at ${data['swell']['components'][whichSwell]['period']}s
    ${data['swell']['components'][whichSwell]['direction']}deg
    ${data['swell']['components'][whichSwell]['compassDirection']}`;
}

export default App;