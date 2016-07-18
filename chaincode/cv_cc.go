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
	VoteCount int64 `json:"vote_count"`
	Email	  string `json:"email"`
}

var accountHeader = "account::"

//Topic voting topic and choices
type Topic struct {
	ID      string   `json:"topic_id"`
	Issuer  string   `json:"issuer"`
	Choices []string `json:"choices"`
	Votes   []int    `json:"votes"`
}

var topicHeader = "topic::"

//Vote vote cast for a given topic
type Vote struct {
	Topic    string `json:"topic"`    //topic being voted upon
	Choice   int    `json:"choice"`   //index of choice
	Quantity int    `json:"quantity"` //quantity of votes
	Issuer   string `json:"issuer"`
	CastDate string `json:"castDate"` //current time in milliseconds as a string
}

var voteHeader = "vote::"

// ============================================================================================================================
// Main
// ============================================================================================================================
func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}

func (t *ChainchatChaincode) readStringSafe(col *shim.Column) string {
	if col == nil {
		return ""
	}

	return col.GetString_()
}

func (t *ChainchatChaincode) readInt64Safe(col *shim.Column) int64 {
	if col == nil {
		return 0
	}

	return col.GetInt64()
}

func (t *ChainchatChaincode) readUint64Safe(col *shim.Column) uint64 {
	if col == nil {
		return 0
	}

	return col.GetUint64()
}

func (t *ChainchatChaincode) readBoolSafe(col *shim.Column) bool {
	if col == nil {
		return false
	}

	return col.GetBool()
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

func (t *SimpleChaincode) write(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
	var name, value string
	var err error
	fmt.Println("running write")

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
	votes := args[1]
	var account = Account{ID: username, Votes: votes}
	accountBytes, err := json.Marshal(&account)
	if err != nil {
		fmt.Println("Error creating account " + account.ID)
		return nil, err
	}

	fmt.Println("Attempting to get state of any existing account for " + account.ID + "...")
	existingBytes, err := stub.GetState(accountHeader + account.ID)
	if err != nil {
		fmt.Println("No existing account found for " + account.ID + ", initializing account")
		err = stub.PutState(accountHeader+account.ID, accountBytes)
		//errRequestAccount, Account := requestAccount(account_id) 
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
			err = stub.PutState(accountHeader+account.ID, accountBytes)
			//err, account = t.requestAccount(account.ID)
			if err == nil {
				fmt.Println("Created account " + account.ID)
				return nil, nil
			}

			fmt.Println("Failed to create initialize account for " + account.ID)
			return nil, err
		}

		return nil, errors.New("Error unmarshalling existing account " + account.ID)
	}

	fmt.Println("existing account bytes: " + string([]byte(existingBytes)))

	fmt.Println("Account already exists for " + account.ID)
	return nil, errors.New("Can't reinitialize existing user " + account.ID)
}

func (t *SimpleChaincode) requestAccount(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
	if len(args) != 1 {
		fmt.Println("Could not obtain username passed to createAcount")
		return nil, errors.New("Incorrect number of arguments. Expecting 1: username of account")
	}

	username := args[0]
	email := args[1]
	var account = Account{ID: username, Email: email, Votes: 0}
	accountBytes, err := json.Marshal(&account)
	if err != nil {
		fmt.Println("Error creating account " + account.ID)
		return nil, err
	}

	fmt.Println("Attempting to get state of any existing account for " + account.ID + "...")
	existingBytes, err := stub.GetState(accountHeader + account.ID)
	if err != nil {
		fmt.Println("No existing account found for " + account.ID + ", initializing account")
		//err = stub.PutState(accountHeader+account.ID, accountBytes)
		//errRequestAccount, Account := requestAccount(account_id) 
		
		//write to the Account request table
		rowAdded, rowErr := stub.InsertRow("AccountRequests", shim.Row{
			Columns: []*shim.Column{
				{&shim.Column_String_{String_: "open"}},
				{&shim.Column_String_{String_: username}},
				{&shim.Column_String_{String_: email}},
			},
		})

		if rowErr != nil || !rowAdded {
			fmt.Println(fmt.Sprintf("[ERROR] Could not insert a message into the ledger: %s", rowErr))
			return nil, rowErr
		}
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
			//err = stub.PutState(accountHeader+account.ID, accountBytes)
			//err, account = t.requestAccount(account.ID)

			//add row to the table
			rowAdded, rowErr := stub.InsertRow("AccountRequests", shim.Row{
				Columns: []*shim.Column{
					{&shim.Column_String_{String_: "open"}},
					{&shim.Column_String_{String_: username}},
					{&shim.Column_String_{String_: email}},
				},
			})

			if rowErr != nil || !rowAdded {
				fmt.Println(fmt.Sprintf("[ERROR] Could not insert a message into the ledger: %s", rowErr))
				return nil, rowErr
			}
			
			if err == nil {
				fmt.Println("Created account " + account.ID)
				return nil, nil
			}

			fmt.Println("Failed to create initialize account for " + account.ID)
			return nil, err
		}

		return nil, errors.New("Error unmarshalling existing account " + account.ID)
	}

	fmt.Println("existing account bytes: " + string([]byte(existingBytes)))

	fmt.Println("Account already exists for " + account.ID)
	return nil, errors.New("Can't reinitialize existing user " + account.ID)
}

// getAccount returns the account matching the given username
/*
func (t *SimpleChaincode) getAccount(stub *shim.ChaincodeStub, accountID string) (Account, error) {
	var account Account
	accountBytes, err := stub.GetState(accountHeader + accountID)
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
*/
func (t *SimpleChaincode) getOpenRequests(stub *shim.ChaincodeStub) (account_ids []string, error) {

	// Retrieve all the rows that are messages for the specified user
	
	//rowChan, rowErr := stub.GetRows("AccountRequests", []shim.Column{shim.Column{Value: &shim.Column_String_{String_: "open"}}})
	rowChan, rowErr := stub.GetRows("AccountRequests", []shim.Column{shim.Column{Value: &shim.Column_String_{String_: "open"}}})
	if rowErr != nil {
		fmt.Println(fmt.Sprintf("[ERROR] Could not retrieve the rows: %s", rowErr))
		return nil, rowErr
	}

	// Extract the rows
	for row := range rowChan {
		if len(row.Columns) != 0 {
			account_ids = append(account_ids, t.readStringSafe(row.Columns[1]));
			fmt.Println(fmt.Sprintf("[INFO] Row: %v", row))
		}
	}
	return account_ids, null	
}

func (t *SimpleChaincode) ChangeRequestStatus(stub *shim.ChaincodeStub, acc Account, status string) (err) {
	rowChan, rowErr := stub.GetRows("AccountRequests", []shim.Column{shim.Column{Value: &shim.Column_String_{String_: "open"}}})
	if rowErr != nil {
		fmt.Println(fmt.Sprintf("[ERROR] Could not retrieve the rows: %s", rowErr))
		return rowErr
	}

	// Extract the rows
	for row := range rowChan {
		if len(row.Columns) != 0 {
			if(t.readStringSafe(row.Columns[1])==Account.ID) {
				rowAdded, rowErr := stub.ReplaceRow("AccountRequests", shim.Row{
					Columns: []*shim.Column{
						{&shim.Column_String_{String_: status}},
						{&shim.Column_String_{String_: Account.ID}},
						{&shim.Column_String_{String_: Account.Email}},
					},
				})

				if rowErr != nil || !rowAdded {
					fmt.Println(fmt.Sprintf("[ERROR] Could not replace a row into the ledger: %s", rowErr))
					return rowErr
				}
				
				if(status == "approved") {
					rowAdded, rowErr = stub.ReplaceRow("AccountRequests", shim.Row{
						Columns: []*shim.Column{	
							{&shim.Column_String_{String_: Account.id}},
							{&shim.Column_Uint64{Uint64: Account.VoteCount}},
							{&shim.Column_String_{String_: Account.Email}},
						},
					})

					if rowErr != nil || !rowAdded {
						fmt.Println(fmt.Sprintf("[ERROR] Could not replace a row into the ledger: %s", rowErr))
						return rowErr
					}
				}
			}
		}
	}
	return null
}

func (t *SimpleChaincode) getAllRequests(stub *shim.ChaincodeStub, accountID string) (Account, error) {
	var account Account
	accountBytes, err := stub.GetState(accountHeader + accountID)
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
	accountBytes, err := stub.GetState(accountHeader + topic.Issuer)
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
	existingTopicBytes, err := stub.GetState(topicHeader + topic.ID)
	if existingTopicBytes == nil {
		fmt.Println("Vote does not exist, creating new vote...")
		topicBytes, err := json.Marshal(&topic)
		if err != nil {
			fmt.Println("Error marshalling topic")
			return nil, err
		}

		err = stub.PutState(topicHeader+topic.ID, topicBytes)
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

		err = stub.PutState(topicHeader+topic.Issuer, accountBytesToWrite)
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

//ClearTopics is for debugging to clear all topics on ledger
func (t *SimpleChaincode) clearTopics(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
	fmt.Println("Clearing all topics...")

	topics, err := getAllTopics(stub)
	if err != nil {
		fmt.Println("Error: Could not retrieve voting topics: ", err)
		return nil, err
	}

	for _, topic := range topics {
		fmt.Println("Clearing topic ID \"" + topic.ID + "\"...")

		err2 := stub.DelState(topicHeader + topic.ID)
		if err2 != nil {
			fmt.Println("Error: Failed to clear vote topic \""+topic.ID+"\": ", err2)
			return nil, err2
		}
		fmt.Println("Successfully cleared vote topic ID " + topic.ID)
	}

	var blank []string
	blankBytes, _ := json.Marshal(&blank)
	err2 := stub.PutState("VoteTopics", blankBytes)
	if err2 != nil {
		fmt.Println("Error: Failed to clear vote topics: ", err2)
		return nil, err2
	}
	fmt.Println("Successfully cleared vote topics")
	return nil, nil
}

//getAllTopics returns an array of all topicIDs
func getAllTopics(stub *shim.ChaincodeStub) ([]Topic, error) {
	fmt.Println("Retrieving all topics...")

	var allTopics []Topic

	topicsBytes, err := stub.GetState("VoteTopics")
	if err != nil {
		fmt.Println("Error retrieving vote topics")
		return nil, err
	}

	var topics []string
	err = json.Unmarshal(topicsBytes, &topics)
	if err != nil {
		fmt.Println("Error unmarshalling vote topics: ", err)
		return nil, err
	}

	for _, value := range topics {
		topicBytes, err := stub.GetState(topicHeader + value)

		var topic Topic
		err = json.Unmarshal(topicBytes, &topic)
		if err != nil {
			fmt.Println("Error retrieving topic "+value+": ", err)
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
	switch function {
	case "init": //initialize the chaincode state, used as reset
		return t.Init(stub, "init", args)
	case "write":
		return t.write(stub, args)
	case "issue_topic":
		return t.issueTopic(stub, args)
	case "clear_all_topics":
		return t.clearTopics(stub, args)
	}

	fmt.Println("invoke did not find func: " + function) //error

	return nil, errors.New("Received unknown function invocation")
}

// Query is our entry point for queries
func (t *SimpleChaincode) Query(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {
	fmt.Println("query is running " + function)

	// Handle different functions
	switch function {
	case "read": //read a variable
		return t.read(stub, args)

	case "get_all_topics":
		allTopics, err := getAllTopics(stub)
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

	case "get_account":
		if len(args) != 1 {
			fmt.Println("Incorrect number of arguments. Expecting 1: string of account ID being queried")
			return nil, nil
		}

		accountID := string([]byte(args[0]))

		account, err1 := getAccount(stub, accountID)
		if err1 != nil {
			fmt.Println("Error from get_account: ", err1)
			return nil, err1
		}

		accountBytes, err2 := json.Marshal(&account)
		if err2 != nil {
			fmt.Println("Error marshalling account: ", err2)
			return nil, err2
		}
		fmt.Println("All success, returning account")
		return accountBytes, nil
	}
	fmt.Println("query did not find func: " + function) //error

	return nil, errors.New("Received unknown function query")
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

	//for testing: enroll first user "Ethan!"
	fmt.Println("Registering first user \"Ethan!\"")
	username := []string{"Ethan!"}
	_, err3 := t.createAccount(stub, username)
	if err3 != nil {
		fmt.Println("Failed to enrolled first user")
	}

	//create table to store all the user account requests
	errAccountRequest := stub.CreateTable("AccountRequests", []*shim.ColumnDefinition{
			&shim.ColumnDefinition{Name: "status", Type: shim.ColumnDefinition_STRING, Key: true},
			&shim.ColumnDefinition{Name: "account_id", Type: shim.ColumnDefinition_STRING, Key: true},
			&shim.ColumnDefinition{Name: "email", Type: shim.ColumnDefinition_STRING, Key: false},
	})
	// Handle table creation errors
	if errAccountRequest != nil {
		fmt.Println(fmt.Sprintf("[ERROR] Could not create account request table: %s", errAccountRequest))
		return nil, errAccountRequest
	}

	//create table to store all the user account requests
	errApprovedAccount := stub.CreateTable("ApprovedAccounts", []*shim.ColumnDefinition{
			&shim.ColumnDefinition{Name: "account_id", Type: shim.ColumnDefinition_STRING, Key: true},
			&shim.ColumnDefinition{Name: "votes", Type: shim.ColumnDefinition_STRING, Key: false},
			&shim.ColumnDefinition{Name: "email", Type: shim.ColumnDefinition_STRING, Key: false},			
	})
	// Handle table creation errors
	if errApprovedAccount != nil {
		fmt.Println(fmt.Sprintf("[ERROR] Could not create account request table: %s", errApprovedAccount))
		return nil, errApprovedAccount
	}
	return nil, nil
}
