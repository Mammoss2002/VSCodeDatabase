import React, { useState, useEffect } from "react";
import Layout from "../layout/Layout";
import "../Loading/Loading.css";
import Grid from "@mui/material/Unstable_Grid2";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import axios from "axios";
import configData from "../../configData.json";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import MultiSelect from "../MultiSelect";
import { v4 as uuidv4 } from "uuid";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { keyframes } from "@mui/system";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useSearchParams } from "react-router-dom";
import ButtonGroup from "@mui/material/ButtonGroup";
import Link from "@mui/material/Link";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Stack from "@mui/material/Stack";

function TesterMonitor() {
  // Loading state
  const [loading, setLoading] = useState(false);
  // Component state
  const [productOptions, setProductOptions] = useState([]);
  const [productSelectedObj, setproductSelectedObj] = useState(null);
  const [productSelected, setProductSelected] = useState("");
  const [testerOptions, setTesterOptions] = useState([]);
  const [testerSelectedObj, setTesterSelectedObj] = useState([]);
  const [run, setRun] = useState(false);
  const intervalSecs = 180;
  const counterIntervalSecs = 1;
  const [counter, setCounter] = useState(intervalSecs);
  const [testersStatus, setTestersStatus] = useState([]);
  const [testersStatusShow, setTestersStatusShow] = useState([]);
  const [firstRun, setFirstRun] = useState(false);
  const [hideOffline, setHideOffline] = useState(true);
  const [logOps, setLogOps] = useState([]);
  const [runningCount, setRunningCount] = useState(0);
  const [idleCount, setIdleCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);

  // URL Params
  const [searchParams] = useSearchParams();
  const modeURLParam = searchParams.get("mode");
  // Server IP
  const serverIP =
    modeURLParam === "local" ? window.location.hostname : configData.BACKEND_IP;
  // console.log(testersStatus);
  useEffect(() => {
    // Get product name from config
    if (!productOptions.length) {
      setLoading(true);
      setProductOptions(configData.productNames);
      setLoading(false);
    }
    // Get Tester Option from API
    if (productSelected !== "" && !testerOptions.length) {
      // For quick select by operation name
      let logOp = [];
      const testerOptionsReduce = configData.testerNames[productSelected].map(
        (testerOption) => {
          // push quick select by operation name
          logOp.push(testerOption.operationName);
          return {
            key: uuidv4(),
            label: testerOption.testerName,
            value: testerOption.testerName,
            valueObj: testerOption,
          };
        }
      );
      // Sort Testers
      testerOptionsReduce.sort(
        (a, b) => a.valueObj.orderNumber - b.valueObj.orderNumber
      );
      // Remove Duplicate array then set state
      setLogOps(Array.from(new Set(logOp)).filter((k) => !k.includes("N/A")));
      setTesterOptions(testerOptionsReduce);
    }

    // count running and idle
    if (testersStatusShow.length) {
      let running = 0;
      let idle = 0;
      let online = 0;
      testersStatusShow
        .filter((t) => t.testerStatus)
        .forEach((t) => {
          online += 1;
          t.data.forEach((ts) => {
            if (ts.current_status === 3) {
              running += 1;
            } else {
              idle += 1;
            }
          });
        });
      setRunningCount(running);
      setIdleCount(idle);
      setOnlineCount(online);
    }

    // User clik GO!!
    if (run) {
      const fecthTestersStatus = async () => {
        setLoading(true);
        await axios
          .all(
            testerSelectedObj.map(async (testerSelected) => {
              try {
                const response = await axios.get(
                  `http://${testerSelected.valueObj.testerIp}/get_all_process_stations_ui`,
                  { timeout: 3000 }
                );
                // push config to response
                response.testerConfig = testerSelected;
                response.testerStatus = true;
                return response;
              } catch (error) {
                return {
                  testerStatus: false,
                  testerConfig: testerSelected,
                  data: [
                    {
                      station_id: 1,
                      current_status: 1,
                      current_station_status: 1,
                      elapsed_seconds_for_display: "OFFLINE",
                      previous_process_plan_result: "",
                    },
                  ],
                };
              }
            })
          )
          .then((response) => setTestersStatus(response));
        setLoading(false);
        setCounter(intervalSecs);
      };

      if (!firstRun) {
        setFirstRun(true);
        fecthTestersStatus();
      }

      const interval = setInterval(() => {
        setCounter((prevCount) => prevCount - counterIntervalSecs);
        if (counter <= 0) {
          fecthTestersStatus();
        }
        // Show/Hide Offline Tester
        if (testersStatus.length && hideOffline) {
          setTestersStatusShow(testersStatus.filter((t) => t.testerStatus));
        } else {
          setTestersStatusShow(testersStatus);
        }
      }, counterIntervalSecs * 1000);

      return () => clearInterval(interval);
    }
  }, [
    productOptions.length,
    productSelected,
    testerOptions.length,
    run,
    counter,
    testerSelectedObj,
    serverIP,
    firstRun,
    hideOffline,
    testersStatus,
    testersStatusShow,
  ]);

  const handleChangeProduct = (event, newValue) => {
    setproductSelectedObj(newValue);
    // Cleanup state
    setTesterSelectedObj([]);
    setTesterOptions([]);
  };

  const handleLogOpClick = (e) => {
    setproductSelectedObj(productSelectedObj);
    setTesterSelectedObj(
      testerOptions.filter((v) => v.label.includes(e.currentTarget.value))
    );
    // Cleanup state
    setTesterOptions([]);
  };

  const handleProductSelectedInputChange = (event, newInputValue) => {
    setProductSelected(newInputValue);
  };

  const getTestersStatus = (e) => {
    e.preventDefault();
    setRun(true);
    setCounter(0);
    setFirstRun(false);
  };

  function CircularProgressWithLabel(props) {
    return (
      <Box sx={{ position: "relative", display: "inline-flex" }}>
        <CircularProgress variant="determinate" {...props} />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: "absolute",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="caption" component="div" color="text.secondary">
            {`${Math.round(props.value)}%`}
          </Typography>
        </Box>
      </Box>
    );
  }

  const renderTesterStatusComponent = (testerStatus) => {
    let colSize = 0;

    const blink = keyframes`
        50% {
            opacity: 0;
        }
    `;

    if (testerStatus.data.length <= 8) {
      colSize = 1;
    } else if (testerStatus.data.length > 8 && testerStatus.data.length <= 16) {
      colSize = 2;
    } else {
      colSize = 2;
    }

    return (
      <Grid key={uuidv4()} xs="auto">
        <Card>
          {/* <CardContent style={{backgroundColor: "#ddd"}}>*/}
          <CardContent>
            <Typography
              sx={{ fontSize: 14 }}
              gutterBottom
              align="center"
              fontWeight="bold"
            >
              <Link
                target="_blank"
                href={`http://${testerStatus.testerConfig.valueObj.testerIp}/OpenTest`}
              >
                {testerStatus.testerConfig.valueObj.testerName}
              </Link>
            </Typography>
            <Grid
              container
              spacing={0.5}
              direction="row"
              // alignItems="center"
              justifyContent="center"
              columns={colSize}
            >
              {Array.from(Array(colSize), (e, index) => {
                return (
                  <Grid
                    container
                    spacing={0.5}
                    direction="column"
                    alignItems="center"
                    // justifyContent="center"
                    columns={colSize}
                    key={uuidv4()}
                  >
                    {testerStatus.data
                      .slice(
                        configData.dataLength[productSelected][index].start,
                        configData.dataLength[productSelected][index].stop
                      )
                      .map((testSlotData) => {
                        let buttonColor = {};
                        if (
                          testSlotData.current_status === 3 &&
                          testSlotData.current_station_status === 3
                        ) {
                          // RUNNING
                          buttonColor = {
                            backgroudColor: "#f0ad4e",
                            color: "#333",
                          };
                        } else if (
                          testSlotData.current_status === 1 &&
                          testSlotData.current_station_status === 1 &&
                          testSlotData.previous_process_plan_result === ""
                        ) {
                          // IDLE
                          buttonColor = {
                            backgroudColor: "#fff",
                            color: "#333",
                          };
                        } else if (
                          testSlotData.current_status === 1 &&
                          testSlotData.current_station_status === 1 &&
                          testSlotData.previous_process_plan_result === "FAILED"
                        ) {
                          // FAILED
                          buttonColor = {
                            backgroudColor: "#d9534f",
                            color: "#fff",
                          };
                        } else if (
                          testSlotData.current_status === 1 &&
                          testSlotData.current_station_status === 1 &&
                          testSlotData.previous_process_plan_result === "PASSED"
                        ) {
                          // PASSED
                          buttonColor = {
                            backgroudColor: "#5cb85c",
                            color: "#fff",
                          };
                        } else if (
                          testSlotData.current_status === 1 &&
                          testSlotData.current_station_status === 1 &&
                          testSlotData.previous_process_plan_result ===
                            "ABORTED"
                        ) {
                          // ABORTED
                          buttonColor = {
                            backgroudColor: "#337ab7",
                            color: "#fff",
                          };
                        } else if (
                          testSlotData.current_status === 3 &&
                          testSlotData.current_station_status === 4
                        ) {
                          // PROMPT
                          buttonColor = {
                            backgroudColor: "#f0ad4e",
                            color: "#333",
                          };
                        }
                        return (
                          <Grid key={uuidv4()} xs="auto">
                            <Button
                              sx={{
                                display: "block",
                                textAlign: "center",
                                backgroundColor: buttonColor.backgroudColor,
                                color: buttonColor.color,
                                ":hover": {
                                  bgcolor: "#99A3A4",
                                  color: "#fff",
                                },
                                // PROMPT
                                animation:
                                  testSlotData.current_status === 3 &&
                                  testSlotData.current_station_status === 4
                                    ? `${blink} 1s linear infinite`
                                    : "",
                              }}
                              variant="contained"
                              onClick={() =>
                                !testSlotData.elapsed_seconds_for_display.includes(
                                  "OFFLINE"
                                )
                                  ? window.open(
                                      `http://${testerStatus.testerConfig.valueObj.testerIp}/station?station_id=${testSlotData.station_id}`
                                    )
                                  : null
                              }
                              target="_blank"
                            >
                              <Typography fontWeight="bold" fontSize={12}>
                                {!testSlotData.elapsed_seconds_for_display.includes(
                                  "OFFLINE"
                                )
                                  ? `${testSlotData.station_name}`
                                  : ""}
                              </Typography>
                              <Typography fontWeight="bold" fontSize={12}>
                                {!testSlotData.elapsed_seconds_for_display.includes(
                                  "OFFLINE"
                                )
                                  ? `${testSlotData.current_serial_number}`
                                  : ""}
                              </Typography>
                              <Typography fontWeight="bold" fontSize={12}>
                                {testSlotData.elapsed_seconds_for_display}
                              </Typography>
                            </Button>
                          </Grid>
                        );
                      })}
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Layout
      title={"Tester Monitor"}
      appBarLeft={
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            sx={{
              display: "block",
              textAlign: "center",
              backgroundColor: "#58D68D",
              color: "#333",
            }}
          >
            {onlineCount} Tester
          </Button>
        </Stack>
      }
      appBar={
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            sx={{
              display: "block",
              textAlign: "center",
              backgroundColor: "#fff",
              color: "#333",
            }}
          >
            {idleCount} Idle
          </Button>
          <Button
            variant="contained"
            sx={{
              display: "block",
              textAlign: "center",
              backgroundColor: "#f0ad4e",
              color: "#333",
            }}
          >
            {runningCount} Running
          </Button>
        </Stack>
      }
    >
      {loading ? <div className="loader"></div> : null}
      <Grid container spacing={2}>
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                <Grid xs={2}>
                  <Autocomplete
                    value={productSelectedObj}
                    onChange={handleChangeProduct}
                    inputValue={productSelected}
                    onInputChange={handleProductSelectedInputChange}
                    getOptionLabel={(option) => option.ProductName}
                    isOptionEqualToValue={(option, anotherOption) =>
                      option.ProductName === anotherOption.ProductName
                    }
                    id="controllable-states-products"
                    options={productOptions}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Product"
                        size="small"
                      />
                    )}
                  />
                </Grid>
                {testerOptions.length ? (
                  <Grid xs>
                    <MultiSelect
                      items={testerOptions}
                      label="Select Tester"
                      placeholder="Select Tester"
                      selectAllLabel="Select all"
                      selectedObj={testerSelectedObj}
                      onChange={(callBack) => {
                        setTesterSelectedObj(callBack);
                      }}
                      size="small"
                    />
                  </Grid>
                ) : null}
                {logOps.length && testerOptions.length ? (
                  <Grid xs={3.5}>
                    <ButtonGroup variant="text" aria-label="text button group">
                      {logOps.map((logOp) => (
                        <Button
                          key={uuidv4()}
                          size="small"
                          value={logOp}
                          onClick={(e) => handleLogOpClick(e)}
                        >
                          {logOp}
                        </Button>
                      ))}
                    </ButtonGroup>
                  </Grid>
                ) : null}
                {testersStatus.length ? (
                  <Grid xs={0.5}>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={hideOffline}
                            size="small"
                            onChange={(e) => {
                              console.log(
                                "target checked? - ",
                                e.target.checked
                              );
                              setHideOffline(e.target.checked);
                            }}
                          />
                        }
                        label={
                          <Typography
                            sx={{ fontSize: 12 }}
                            align="center"
                            fontWeight="bold"
                          >
                            Hide Offline
                          </Typography>
                        }
                      />
                    </FormGroup>
                  </Grid>
                ) : null}
                {testerSelectedObj.length ? (
                  <Grid xs={0.5}>
                    <Button variant="text" onClick={getTestersStatus}>
                      GO!!
                    </Button>
                  </Grid>
                ) : null}
                {testerSelectedObj.length ? (
                  <Grid xs={0.5}>
                    <CircularProgressWithLabel
                      value={((intervalSecs - counter) / intervalSecs) * 100}
                    />
                  </Grid>
                ) : null}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Grid container spacing={0.5}>
        {testersStatusShow.length
          ? testersStatusShow.map((testerValues) => {
              return renderTesterStatusComponent(testerValues);
            })
          : null}
      </Grid>
    </Layout>
  );
}

export default TesterMonitor;
