/*
Copyright IBM Corp 2016 All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

		 http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

// SimpleChaincode example simple Chaincode implementation
type SimpleChaincode struct {
}

//Account account of user who can vote
type Account struct {
	ID        string  `json:"account_id"`
	VoteCount float64 `json:"vote_count"`
}

//Topic voting topic and choices
type Topic struct {
	ID      string   `json:"topic_id"`
	Issuer  string   `json:"issuer"`
	Choices []string `json:"choices"`
	Votes   []int    `json:"votes"`
}

//Vote vote cast for a given topic
type Vote struct {
	Topic    string `json:"topic"`  //topic being voted upon
	Choice   int    `json:"choice"` //index of choice
	Qty      int    `json:"qty"`    //quantity of votes
	Voter    string `json:"voter"`
	CastDate string `json:"castDate"` //current time in milliseconds as a string
}

// ============================================================================================================================
// Main
// ============================================================================================================================
func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}

func (t *SimpleChaincode) write(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
	var name, value string
	var err error
	fmt.Println("running write()")

	if len(args) != 2 {
		return nil, errors.New("Incorrect number of arguments. Expecting 2: name of the variable and value to set")
	}

	name = args[0]
	value = args[1]
	err = stub.PutState(name, []byte(value))
	if err != nil {
		return nil, err
	}
	return nil, nil
}

func (t *SimpleChaincode) createAccount(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
	if len(args) != 1 {
		fmt.Println("Could not obtain username passed to createAcount")
		return nil, errors.New("Incorrect number of arguments. Expecting 1: username of account")
	}

	username := args[0]

	var account = Account{ID: username, VoteCount: 10}
	accountBytes, err := json.Marshal(&account)
	if err != nil {
		fmt.Println("Error creating account " + account.ID)
		return nil, err
	}

	fmt.Println("Attempting to get state of any existing account for " + account.ID + "...")
	existingBytes, err := stub.GetState(account.ID)
	if err != nil {
		fmt.Println("No existing account found for " + account.ID + ", initializing account")
		err = stub.PutState(account.ID, accountBytes)

		if err == nil {
			fmt.Println("Created account " + account.ID)
			return nil, nil
		}

		fmt.Println("Failed to initialize an account for " + account.ID)
		return nil, errors.New("Failed to initialize an account for " + account.ID + " => " + err.Error())
	}

	var existingAccount Account
	err = json.Unmarshal(existingBytes, &existingAccount)
	if err != nil {
		fmt.Println("Error unmarshalling account " + account.ID + "\n--->: " + err.Error())

		if strings.Contains(err.Error(), "unexpected end") {
			fmt.Println("No data means existing account found for " + account.ID + ", initializing account.")
			err = stub.PutState(account.ID, accountBytes)

			if err == nil {
				fmt.Println("Created account " + account.ID)
				return nil, nil
			}

			fmt.Println("Failed to create initialize account for " + account.ID)
			return nil, err
		}

		return nil, errors.New("Error unmarshalling existing account " + account.ID)
	}

	fmt.Println("Account already exists for " + account.ID)
	return nil, errors.New("Can't reinitialize existing user " + account.ID)
}

// Init resets all the things
func (t *SimpleChaincode) Init(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {
	fmt.Println("Initializing vote topics...")
	var blank []string
	blankBytes, _ := json.Marshal(&blank)
	err := stub.PutState("VoteTopics", blankBytes)
	if err != nil {
		fmt.Println("Failed to initialize vote topics")
	} else {
		fmt.Println("Successfully initialized vote topics")
	}

	fmt.Println("Initializing cast votes...")
	blankBytes2, _ := json.Marshal(&blank)
	err2 := stub.PutState("CastVotes", blankBytes2)
	if err2 != nil {
		fmt.Println("Failed to initialize cast votes")
	} else {
		fmt.Println("Successfully initialized cast votes")
	}

	//for testing: enroll first user "ethan!"
	fmt.Println("Registering first user \"ethan!\"")
	username := []string{"ethan!"}
	//username[0] = "ethan!"
	_, err3 := t.createAccount(stub, username)
	if err3 != nil {
		fmt.Println("Failed to enrolled first user")
	}

	return nil, nil
}

//GetAccount returns the account matching the given username
func GetAccount(accountID string, stub *shim.ChaincodeStub) (Account, error) {
	var account Account
	accountBytes, err := stub.GetState(accountID)
	if err != nil {
		fmt.Println("Could not find account " + accountID)
		return account, err
	}

	err = json.Unmarshal(accountBytes, &account)
	if err != nil {
		fmt.Println("Error unmarshalling account " + accountID + "\n err: " + err.Error())
		return account, err
	}

	return account, nil
}

func (t *SimpleChaincode) issueTopic(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
	/*		0
			json
			{
				"topic_id": "string",
				"issuer": "username",
				"choices": ["option1", "option2"]
			}
	*/

	if len(args) != 1 {
		fmt.Println("Incorrect number of arguments. Expecting 1: json object of topic being issued")
		return nil, errors.New("Incorrect number of arguments. Expecting 1: json object of topic being issued")
	}

	var topic Topic
	var err error
	var account Account

	fmt.Println("Unmarshalling topic")
	err = json.Unmarshal([]byte(args[0]), &topic)
	if err != nil {
		fmt.Println("Invalid topic issued")
		return nil, err
	}

	fmt.Println("Getting state of issuer " + topic.Issuer)
	accountBytes, err := stub.GetState(topic.Issuer)
	if err != nil {
		fmt.Println("Error getting state of - " + topic.Issuer)
		return nil, err
	}
	err = json.Unmarshal(accountBytes, &account)
	if err != nil {
		fmt.Println("Error unmarshalling accountBytes")
		return nil, err
	}

	fmt.Println("Getting state on topic " + topic.ID)
	existingTopicBytes, err := stub.GetState(topic.ID)
	if existingTopicBytes == nil {
		fmt.Println("Vote does not exist, creating new vote...")
		topicBytes, err := json.Marshal(&topic)
		if err != nil {
			fmt.Println("Error marshalling topic")
			return nil, err
		}

		err = stub.PutState(topic.ID, topicBytes)
		if err != nil {
			fmt.Println("Error issuing topic")
			return nil, err
		}

		fmt.Println("Marshalling account bytes to write")
		accountBytesToWrite, err := json.Marshal(&account)
		if err != nil {
			fmt.Println("Error marshalling account")
			return nil, err
		}

		err = stub.PutState(topic.Issuer, accountBytesToWrite)
		if err != nil {
			fmt.Println("Error putting state on accountBytesToWrite")
			return nil, err
		}

		fmt.Println("Getting Vote Topics")
		voteTopicsBytes, err := stub.GetState("VoteTopics")
		if err != nil {
			fmt.Println("Error retrieving Vote Topics")
			return nil, err
		}
		var voteTopics []string
		err = json.Unmarshal(voteTopicsBytes, &voteTopics)
		if err != nil {
			fmt.Println("Error unmarshalling Vote Topics")
			return nil, err
		}

		fmt.Println("Appending the new topic to Vote Topics")
		foundTopic := false
		for _, tmp := range voteTopics {
			if tmp == topic.ID {
				foundTopic = true
			}
		}
		if foundTopic == false {
			voteTopics = append(voteTopics, topic.ID)
			voteTopicBytesToWrite, err := json.Marshal(&voteTopics)
			if err != nil {
				fmt.Println("Error marshalling vote topics")
				return nil, err
			}
			fmt.Println("Put state on Vote Topics")
			err = stub.PutState("VoteTopics", voteTopicBytesToWrite)
			if err != nil {
				fmt.Println("Error writting vote topics back")
				return nil, err
			}
		}

		fmt.Println("Issued topic " + topic.ID)
		return nil, nil
	}

	fmt.Println("Topic already exists")
	return nil, nil
}

//GetAllTopics returns an array of all topicIDs
func GetAllTopics(stub *shim.ChaincodeStub) ([]Topic, error) {
	var allTopics []Topic

	topicsBytes, err := stub.GetState("VoteTopics")
	if err != nil {
		fmt.Println("Error retrieving vote topics")
		return nil, err
	}

	var topics []string
	err = json.Unmarshal(topicsBytes, &topics)
	if err != nil {
		fmt.Println("Error unmarshalling vote topics")
		return nil, err
	}

	for _, value := range topics {
		topicBytes, err := stub.GetState(value)

		var topic Topic
		err = json.Unmarshal(topicBytes, &topic)
		if err != nil {
			fmt.Println("Error retrieving topic " + value)
			return nil, err
		}

		fmt.Println("Appending topic " + value)
		allTopics = append(allTopics, topic)
	}

	return allTopics, nil
}

// Invoke is our entry point to invoke a chaincode function
func (t *SimpleChaincode) Invoke(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {
	fmt.Println("invoke is running " + function)

	// Handle different functions
	if function == "init" { //initialize the chaincode state, used as reset
		return t.Init(stub, "init", args)
	} else if function == "write" {
		return t.write(stub, args)
	} else if function == "issue_topic" {
		return t.issueTopic(stub, args)
	}
	fmt.Println("invoke did not find func: " + function) //error

	return nil, errors.New("Received unknown function invocation")
}

func (t *SimpleChaincode) read(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
	var name string
	var err error

	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting 1: name of the var to query")
	}

	name = args[0]
	valAsbytes, err := stub.GetState(name)
	if err != nil {
		return nil, errors.New("Error: failed to get state for " + name)
	}

	return valAsbytes, nil
}

// Query is our entry point for queries
func (t *SimpleChaincode) Query(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {
	fmt.Println("query is running " + function)

	// Handle different functions
	if function == "read" { //read a variable
		return t.read(stub, args)
	} else if function == "get_all_topics" {
		fmt.Println("Getting all topics")
		allTopics, err := GetAllTopics(stub)
		if err != nil {
			fmt.Println("Error from get_all_topics")
			return nil, err
		}

		allTopicsBytes, err1 := json.Marshal(&allTopics)
		if err1 != nil {
			fmt.Println("Error marshalling allTopics")
			return nil, err1
		}
		fmt.Println("All success, returning allTopics")
		return allTopicsBytes, nil
	}
	fmt.Println("query did not find func: " + function) //error

	return nil, errors.New("Received unknown function query")
}