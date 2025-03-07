import morgan from "morgan";
import express from "express";
import request from "supertest";
import assert from 'assert';
import mongoose from "mongoose";
import { expect } from "chai";

import authRouter from "../routes/authRouter.js";
import usersRouter from "../routes/usersRouter.js";
import complexesRouter from "../routes/complexesRouter.js";
import chatRoomsRouter from "../routes/chatRoomsRouter.js";
import notificationsRouter from "../routes/notificationsRouter.js";
import votingsRouter from "../routes/votingsRouter.js";
import newsChannelRouter from "../routes/newsChannelRouter.js";
import newsRouter from "../routes/NewsRouter.js";
import contactInfoRouter from "../routes/contactInfoRouter.js";
import { readFileSync } from "fs";
import path from "path";
import { homedir } from "os";
// import googleAuthRouter from "../routes/googleAuthRouter.js";

const app = express();

// app.use(morgan("tiny"));
app.use(express.json());
app.use(express.static("upload/images"));
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/complexes", complexesRouter);
app.use("/chat_rooms", chatRoomsRouter);
app.use("/notifications", notificationsRouter);
app.use("/votings", votingsRouter);
app.use("/news_channels", newsChannelRouter);
app.use("/news", newsRouter);
app.use("/contact_info", contactInfoRouter);

let bearerToken = null;
const complexID = '67a3a0c37ca64083c1ff9799';
let newsID = null;
const newsChannelID = '6795115a5824a1b87515b14d';
let contactInfoID = null;
let pollID = null;
let optionsIds = null;

function getToken(done) {
  request(app)
    .post('/auth/login')
    .send({email: 'Password1@email.com', password: "Password1"})
    .expect('Content-Type', /json/)
    .expect(200)
    .end(function(err, res) {
      if (err) {
        throw err;
      }
      bearerToken = res.body.tokens.accessToken;          
      done();
    });
}

let userID = null;

function getUserID(done) {
  request(app)
    .get('/auth/current')
    .set("Authorization", "Bearer " + bearerToken)
    .end(function(err, res) {
      if (err) {
        throw err;
      }
      userID = res.body._id;
      done();
    });
}

describe('Testing routes', () => {
  before(function(done) {
    this.timeout(10000);
    mongoose
      .connect(process.env.DB_HOST)
      .then(() => {
        done();
      })
  })

  describe('Test /auth', () => {
    beforeEach(getToken);

    it("POST /login", function(done) {
      request(app)
        .post('/auth/login')
        .send({email: 'Password1@email.com', password: "Password1"})
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            throw err;
          }
          done();
        });
    });

    it("POST /logout", function(done) {
      request(app)
        .post('/auth/logout')
        .send()
        .set("Authorization", "Bearer " + bearerToken)
        .expect(204)
        .end(function(err, res) {          
          if (err) {
            throw err;
          }
          done();
        });
    });

    it("GET /current", function(done) {
      request(app)
        .get('/auth/current')
        .set("Authorization", "Bearer " + bearerToken)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          expect(res.body).to.have.all.keys("tokens", "_id", "name", "email",
            "phone", "avatar", "is_admin", "buildings", "tempCode", "tempCodeTime");
          if (err) {
            throw err;
          }
          done();
        });
    });

    it("GET /refresh", function(done) {
      request(app)
        .get('/auth/refresh')
        .set("Authorization", "Bearer " + bearerToken)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          expect(res.body).to.have.all.keys("accessToken", "refreshToken");
          if (err) {
            throw err;
          }
          done();
        });
    });

    it("PUT /forgot-password", function(done) {
      request(app)
        .put('/auth/forgot-password')
        .send({ email: "Password1@email.com" })
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            throw err;
          }
          done();
        });
    });

    it("PUT /update", function(done) {
      request(app)
        .put('/auth/update')
        .send({ email: "Password1@email.com", name: "password2@email.com" })
        .set("Authorization", "Bearer " + bearerToken)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          expect(res.body.name).to.equal('password2@email.com');
          if (err) {
            throw err;
          }
          request(app)
            .put('/auth/update')
            .send({ email: "Password1@email.com", name: "password1@email.com" })
            .set("Authorization", "Bearer " + bearerToken)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
              expect(res.body.name).to.equal('password1@email.com');
              if (err) {
                throw err;
              }
              done();
            });
        });
    });
  })

  describe('Test /complexes', function() {
    before(getToken);

    it("POST /", function(done) {
      this.timeout(10000);
      request(app)
        .post('/complexes')
        .field('name', 'Test Complex')
        .field('addresses', ['1', '2', '3a'])
        .attach("image", path.join(homedir(), 'Downloads/Designer (7).jpeg'), 'utf8')
        .set('Authorization', 'Bearer ' + bearerToken)
        .expect(403)
        .end(function(err, res) {          
          if (err) {
            throw err;
          }
          if (res.body._id) {
            complexID = res.body._id;
          }
          
          done();
        });
    });

    it("PUT /:complexId", function(done) {      
      request(app)
        .put('/complexes' + '/' + complexID)
        .send({
          name: 'Test Complex', 
          buildings: [ 
            { address: '1', apartments: [{ number: 1, entrance: 1 }, { number: 2, entrance: 1 }] },
            { address: '2', apartments: [{ number: 1, entrance: 1 }, { number: 2, entrance: 1 }] } 
          ],
        })
        .set('Authorization', 'Bearer ' + bearerToken)
        .expect(200)
        .end(function(err, res) {          
          if (err) {
            throw err;
          }
          done();
        });
    });
  })



  describe('Test /users', function() {
    before(getToken);
    before(getUserID);

    it("PUT /addresses", function(done) {
      this.timeout(5000);
      request(app)
        .put('/users/addresses')
        .send({
          residential_complex: "Test Complex", building: "1", entrance: 1, apartment: 1,
        })
        .set('Authorization', 'Bearer ' + bearerToken)
        .expect(200)
        .end(function(err, res) {          
          if (err) {
            throw err;
          }
          request(app)
            .put('/users/addresses')
            .send({
              residential_complex: "Test Complex", building: "1", entrance: 1, apartment: 2,
            })
            .set('Authorization', 'Bearer ' + bearerToken)
            .expect(200)
            .end(function(err, res) {          
              if (err) {
                throw err;
              }
              done();
            });
        });
    });
  
    it("PATCH /addresses/:userID", function(done) {
      request(app)
        .patch('/users/addresses/' + userID)
        .query({
          residential_complex: "Test Complex", building: "1", entrance: 1, apartment: 2,
        })
        .set('Authorization', 'Bearer ' + bearerToken)
        .expect(201)
        .end(function(err, res) {          
          if (err) {
            throw err;
          }
          done();
        });
    });
  
    it("PATCH /addresses/:userID/:complexId", function(done) {
      request(app)
        .patch('/users/addresses/' + userID + '/' + complexID)
        .query({
          moderator: true
        })
        .set('Authorization', 'Bearer ' + bearerToken)
        .expect(200)
        .end(function(err, res) {          
          if (err) {
            throw err;
          }
          done();
        });
    });
  
    it("DELETE /addresses", function(done) {
      request(app)
        .delete('/users/addresses')
        .send({
          residential_complex: "Test Complex", building: "1", entrance: 1, apartment: 1,
        })
        .set('Authorization', 'Bearer ' + bearerToken)
        .expect(200)
        .end(function(err, res) {          
          if (err) {
            throw err;
          }
          request(app)
            .delete('/users/addresses')
            .send({
              residential_complex: "Test Complex", building: "1", entrance: 1, apartment: 2,
            })
            .set('Authorization', 'Bearer ' + bearerToken)
            .expect(200)
            .end(function(err, res) {          
              if (err) {
                throw err;
              }
              done();
            });
        });
    });
  })

  describe('Test /news', function() {
    before(getToken);

    it("POST /:newsChannelId", function(done) {
      request(app)
        .post('/news/' + newsChannelID)
        .send({ picture: "Test",
          title: "TEST NEWS",
          titleUA: "ТЕСТОВА НОВИНА",
          text: "Test news",
          textUA: "Тестова новина"
        })
        .set('Authorization', 'Bearer ' + bearerToken)
        .expect(201)
        .end(function(err, res) {          
          if (err) {
            throw err;
          }
          newsID = res.body._id;
          done();
        });
    });

    it("PATCH /:newsId", function(done) {
      request(app)
        .patch('/news/' + newsID)
        .send({ reaction: '&#x261D;' })
        .set('Authorization', 'Bearer ' + bearerToken)
        .expect(200)
        .end(function(err, res) {          
          if (err) {
            throw err;
          }
          request(app)
            .patch('/news/' + newsID)
            .send({ reaction: '&#x261C;' })
            .set('Authorization', 'Bearer ' + bearerToken)
            .expect(200)
            .end(function(err, res) {          
              if (err) {
                throw err;
              }
              done();
            });
        });
    });

    it("DELETE /:newsId", function(done) {
      request(app)
        .delete('/news/' + newsID)
        .set('Authorization', 'Bearer ' + bearerToken)
        .expect(200)
        .end(function(err, res) {          
          if (err) {
            throw err;
          }
          done();
        });
    });
  })

  describe('Test /contact_info', function() {
    before(getToken);

    it("POST /:residential_complex_id/:building_id?", function(done) {
      console.log(complexID);
      
      request(app)
        .post('/contact_info/' + complexID)
        .send({
          title: "TEST CONTACT",
          titleUA: "ТЕСТОВА КОНТАКТНА ІНФО",
          description: "TEST CONTACT",
          descriptionUA: "ТЕСТОВА КОНТАКТНА ІНФО",
          location: "+1.0 -1.0"
        })
        .set('Authorization', 'Bearer ' + bearerToken)
        .expect(201)
        .end(function(err, res) {          
          if (err) {
            throw err;
          }
          contactInfoID = res.body._id;
          done();
        });
    });

    it("DELETE /:contactInfoID", function(done) {
      console.log(complexID);
      
      request(app)
        .delete('/contact_info/' + contactInfoID)
        .set('Authorization', 'Bearer ' + bearerToken)
        .expect(200)
        .end(function(err, res) {          
          if (err) {
            throw err;
          }
          done();
        });
    });
  })

  describe('Test /votings', function() {
    before(getToken);

    it("POST /:complexID", function(done) {
      request(app)
        .post('/votings/' + complexID)
        .send({
          headline: "TEST VOTING",
          votingType: "Multiple",
          options: [{ name: "1" }, { name: "2" }, { name: "3" }],
          startDate: new Date(Date.now()),
          displayType: "Number"
        })
        .set('Authorization', 'Bearer ' + bearerToken)
        .expect(201)
        .end(function(err, res) {          
          if (err) {
            throw err;
          }
          pollID = res.body._id;
          optionsIds = res.body.options.map((item) => item._id);
          done();
        });
    });

    it("PATCH /:votingID", function(done) {
      request(app)
        .patch('/votings/' + pollID)
        .send({
          optionsIds: [optionsIds[2]]
        })
        .set('Authorization', 'Bearer ' + bearerToken)
        .expect(200)
        .end(function(err, res) {          
          if (err) {
            throw err;
          }
          console.log(res);
          done();
        });
    });

    it("DELETE /:votingID", function(done) {      
      request(app)
        .delete('/votings/' + pollID)
        .set('Authorization', 'Bearer ' + bearerToken)
        .expect(200)
        .end(function(err, res) {          
          if (err) {
            throw err;
          }
          done();
        });
    });
  })
})
